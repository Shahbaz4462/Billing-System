import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { getProducts, getSettings, getNextBillNumber, addBill, updateProduct, getBills, deleteBill as deleteBillDB, getCategories } from '../store/database';
import type { CartItem, Bill, BillItem, PaymentMethod, BillStatus } from '../types';
import Modal from '../components/Modal';
import ReceiptPreview from '../components/ReceiptPreview';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiShoppingCart, FiSave, FiPause, FiPlay, FiX } from 'react-icons/fi';

export default function BillingPage() {
  const { user, t, notify, logAction, language } = useApp();
  const isUrdu = language === 'ur';
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);

  const products = useMemo(() => getProducts(), [refreshKey]);
  const categories = useMemo(() => getCategories(), []);
  const sett = getSettings();

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.quantity > 0);
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.categoryId === categoryFilter);
    }
    
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(s) || 
        p.nameUrdu?.toLowerCase().includes(s) ||
        p.code.toLowerCase().includes(s) || 
        p.barcode.includes(s)
      );
    }
    
    return filtered;
  }, [search, products, categoryFilter]);

  // Global keyboard listener for auto-focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isInputFocused = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      
      // If typing and not in an input, focus search
      if (!isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Keyboard navigation for product list
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProductIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProductIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[selectedProductIndex]) {
        addToCart(filteredProducts[selectedProductIndex].id);
        setSearch('');
        setSelectedProductIndex(0);
      }
    } else if (e.key === 'Escape') {
      setSearch('');
      setSelectedProductIndex(0);
    }
  };

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedProductIndex(0);
  }, [search]);

  const addToCart = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setCart(prev => {
      const existing = prev.find(c => c.product.id === productId);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          notify('warning', 'Not enough stock');
          return prev;
        }
        return prev.map(c => c.product.id === productId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1, discount: 0, discountType: 'flat' }];
    });
    notify('success', `Added ${isUrdu && product.nameUrdu ? product.nameUrdu : product.name}`);
  }, [products, notify, isUrdu]);

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.product.id !== productId) return c;
        const newQty = c.quantity + delta;
        if (newQty <= 0) return c;
        if (newQty > c.product.quantity) {
          notify('warning', 'Not enough stock');
          return c;
        }
        return { ...c, quantity: newQty };
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const subtotal = cart.reduce((s, c) => s + c.product.salePrice * c.quantity, 0);
  const discountAmount = discountType === 'percentage' ? Math.round(subtotal * discountValue / 100) : discountValue;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * sett.taxRate / 100);
  const grandTotal = afterDiscount + taxAmount;

  const completeSale = (status: BillStatus = 'completed') => {
    if (cart.length === 0) {
      notify('warning', 'Cart is empty');
      return;
    }

    const billNumber = getNextBillNumber();
    const items: BillItem[] = cart.map(c => ({
      productId: c.product.id,
      productName: c.product.name,
      productCode: c.product.code,
      quantity: c.quantity,
      unitPrice: c.product.salePrice,
      discount: 0,
      total: c.product.salePrice * c.quantity,
    }));

    const bill: Omit<Bill, 'id'> = {
      billNumber,
      customerName: customerName || 'Walk-in',
      customerPhone,
      employeeId: user!.id,
      employeeName: user!.fullName,
      items,
      subtotal,
      discountAmount,
      discountType,
      discountValue,
      taxRate: sett.taxRate,
      taxAmount,
      grandTotal,
      paymentMethod,
      status,
      updateCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedBill = addBill(bill);

    if (status === 'completed') {
      // Deduct stock
      cart.forEach(c => {
        const prod = products.find(p => p.id === c.product.id);
        if (prod) {
          updateProduct(prod.id, { quantity: prod.quantity - c.quantity });
        }
      });
      logAction('Bill Created', `Bill ${billNumber} created for ${grandTotal} ${sett.currency}`);
      setLastBill({ ...savedBill, id: savedBill.id });
      setShowReceipt(true);
    } else if (status === 'draft') {
      logAction('Draft Saved', `Draft bill ${billNumber} saved`);
      notify('info', 'Bill saved as draft');
    } else if (status === 'held') {
      logAction('Bill Held', `Bill ${billNumber} held`);
      notify('info', 'Bill held for later');
    }

    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountValue(0);
    setRefreshKey(k => k + 1);
  };

  const drafts = useMemo(() => getBills().filter(b => b.status === 'draft'), [refreshKey]);
  const heldBills = useMemo(() => getBills().filter(b => b.status === 'held'), [refreshKey]);

  const loadBill = (bill: Bill) => {
    const loadedCart: CartItem[] = bill.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        product: prod || { id: item.productId, name: item.productName, code: item.productCode, salePrice: item.unitPrice, quantity: 999, nameUrdu: '', barcode: '', categoryId: '', unitType: 'piece', purchasePrice: 0, minimumStock: 0, supplierName: '', batchNumber: '', expiryDate: '', createdAt: '' },
        quantity: item.quantity,
        discount: 0,
        discountType: 'flat' as const,
      };
    });
    setCart(loadedCart);
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
    setDiscountValue(bill.discountValue);
    setDiscountType(bill.discountType);
    setPaymentMethod(bill.paymentMethod);
    deleteBillDB(bill.id);
    setRefreshKey(k => k + 1);
    setShowDrafts(false);
    setShowHeld(false);
    notify('info', 'Bill loaded into cart');
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Left: Product Search */}
      <div className="lg:w-[55%] xl:w-[60%] flex flex-col min-h-0">
        {/* Search */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('searchProduct')}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm shadow-sm"
          />
          {search && (
            <button 
              onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${categoryFilter === 'all' ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
          >
            {t('all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${categoryFilter === cat.id ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
            >
              {isUrdu && cat.nameUrdu ? cat.nameUrdu : cat.name}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={() => setShowDrafts(true)} className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium flex items-center gap-1 transition-all">
            <FiSave size={12} /> {t('loadDraft')} ({drafts.length})
          </button>
          <button onClick={() => setShowHeld(true)} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-medium flex items-center gap-1 transition-all">
            <FiPlay size={12} /> {t('heldBills')} ({heldBills.length})
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 content-start pb-4 scrollbar-thin">
          {filteredProducts.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => addToCart(p.id)}
              className={`bg-white dark:bg-slate-800 border rounded-xl p-3 text-left hover:shadow-lg transition-all group ${
                idx === selectedProductIndex && search 
                  ? 'border-primary-500 ring-2 ring-primary-500/30 shadow-lg' 
                  : 'border-gray-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
            >
              <div className="text-2xl mb-1">🧁</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {isUrdu && p.nameUrdu ? p.nameUrdu : p.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{p.code}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{sett.currency} {p.salePrice}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.quantity <= p.minimumStock ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                  {p.quantity}
                </span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
              <FiSearch size={40} className="mx-auto mb-2 opacity-30" />
              <p>{t('noData')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="lg:w-[45%] xl:w-[40%] bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col min-h-[400px] lg:min-h-0 shadow-xl">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiShoppingCart size={18} className="text-primary-500" /> {t('cart')} 
            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs">{cart.length}</span>
          </h3>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-danger-500 hover:text-danger-700 font-medium flex items-center gap-1 transition-all">
              <FiX size={12} /> {t('clearCart')}
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <FiShoppingCart size={48} className="mb-3 opacity-20" />
              <p className="text-sm">{isUrdu ? 'کارٹ خالی ہے' : 'Cart is empty'}</p>
              <p className="text-xs mt-1">{isUrdu ? 'مصنوعات شامل کرنے کے لیے ٹائپ کریں' : 'Start typing to add products'}</p>
            </div>
          ) : cart.map(c => (
            <div key={c.product.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 hover:border-primary-200 dark:hover:border-primary-800 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {isUrdu && c.product.nameUrdu ? c.product.nameUrdu : c.product.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{sett.currency} {c.product.salePrice} × {c.quantity}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateCartQty(c.product.id, -1)} className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-all">
                  <FiMinus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white">{c.quantity}</span>
                <button onClick={() => updateCartQty(c.product.id, 1)} className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-all">
                  <FiPlus size={14} />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white w-20 text-right">{sett.currency} {c.product.salePrice * c.quantity}</p>
              <button onClick={() => removeFromCart(c.product.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-4 space-y-3 bg-gray-50/50 dark:bg-slate-800/50 rounded-b-2xl">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-2">
            <input
              ref={customerNameRef}
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder={t('customerName')}
              className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              ref={customerPhoneRef}
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder={t('customerPhone')}
              className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Discount */}
          <div className="flex gap-2">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'flat' | 'percentage')}
              className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="flat">{t('flat')}</option>
              <option value="percentage">{t('percentage')}</option>
            </select>
            <input
              type="number"
              value={discountValue || ''}
              onChange={e => setDiscountValue(Number(e.target.value))}
              placeholder={t('discount')}
              className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min="0"
            />
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-4 gap-1.5">
            {(['cash', 'card', 'jazzcash', 'easypaisa'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                  paymentMethod === m
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {m === 'cash' ? '💵' : m === 'card' ? '💳' : m === 'jazzcash' ? '📱' : '📲'} {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm bg-white dark:bg-slate-700/50 rounded-xl p-3 border border-gray-100 dark:border-slate-600">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>{t('subtotal')}</span>
              <span>{sett.currency} {subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>{t('discount')}</span>
                <span>-{sett.currency} {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>{t('tax')} ({sett.taxRate}%)</span>
              <span>{sett.currency} {taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-slate-600">
              <span>{t('grandTotal')}</span>
              <span className="text-primary-600 dark:text-primary-400">{sett.currency} {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => completeSale('draft')}
              disabled={cart.length === 0}
              className="py-3 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FiSave size={14} /> {t('saveDraft')}
            </button>
            <button
              onClick={() => completeSale('held')}
              disabled={cart.length === 0}
              className="py-3 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FiPause size={14} /> {t('holdBill')}
            </button>
            <button
              onClick={() => completeSale('completed')}
              disabled={cart.length === 0}
              className="py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-all"
            >
              <FiShoppingCart size={14} /> {t('completeSale')}
            </button>
          </div>
        </div>
      </div>

      {/* Professional Receipt Preview */}
      {showReceipt && lastBill && (
        <ReceiptPreview 
          bill={lastBill} 
          onClose={() => setShowReceipt(false)}
          onPrint={() => notify('success', 'Receipt printed!')}
        />
      )}

      {/* Drafts Modal */}
      <Modal isOpen={showDrafts} onClose={() => setShowDrafts(false)} title={t('loadDraft')}>
        {drafts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noData')}</p>
        ) : (
          <div className="space-y-2">
            {drafts.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{d.billNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{d.customerName} - {sett.currency} {d.grandTotal}</p>
                  <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => loadBill(d)} className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-md transition-all">Load</button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Held Bills Modal */}
      <Modal isOpen={showHeld} onClose={() => setShowHeld(false)} title={t('heldBills')}>
        {heldBills.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noData')}</p>
        ) : (
          <div className="space-y-2">
            {heldBills.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-700 transition-all">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{d.billNumber}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{d.customerName} - {sett.currency} {d.grandTotal}</p>
                  <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => loadBill(d)} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm rounded-xl hover:from-amber-600 hover:to-amber-700 shadow-md transition-all">Resume</button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
