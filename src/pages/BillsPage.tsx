import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { getBills, updateBill, deleteBill, addBillHistory, getBillHistory, getSettings, getProducts, createBillSnapshot, calculateBillChanges, getDeviceName, getBillHistoryCount } from '../store/database';
import type { Bill, BillItem, BillHistory, PaymentMethod } from '../types';
import Modal from '../components/Modal';
import ReceiptPreview from '../components/ReceiptPreview';
import { FiSearch, FiEye, FiEdit2, FiTrash2, FiPrinter, FiClock, FiFilter, FiPlus, FiMinus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function BillsPage() {
  const { user, t, notify, logAction } = useApp();
  const isOwner = user?.role === 'owner';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [editBillData, setEditBillData] = useState<Bill | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const sett = getSettings();
  const allProducts = useMemo(() => getProducts(), [refreshKey]);
  const bills = useMemo(() => getBills().filter(b => b.status === 'completed' || b.status === 'void').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [refreshKey]);

  const filteredBills = useMemo(() => {
    let filtered = bills;
    if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
    if (dateFrom) filtered = filtered.filter(b => new Date(b.createdAt) >= new Date(dateFrom));
    if (dateTo) {
      const to = new Date(dateTo); to.setDate(to.getDate() + 1);
      filtered = filtered.filter(b => new Date(b.createdAt) < to);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(b => b.billNumber.toLowerCase().includes(s) || b.customerName.toLowerCase().includes(s) || b.customerPhone.includes(s));
    }
    return filtered;
  }, [bills, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredBills.length / pageSize);
  const paginatedBills = filteredBills.slice((page - 1) * pageSize, page * pageSize);

  const viewBill = (bill: Bill) => { setSelectedBill(bill); setShowViewModal(true); };
  
  const editBill = (bill: Bill) => {
    if (!isOwner && bill.updateCount >= 2) {
      notify('error', t('updateLimit'));
      return;
    }
    setSelectedBill(bill);
    setEditBillData(JSON.parse(JSON.stringify(bill))); // Deep clone
    setShowEditModal(true);
  };

  const printBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPrintModal(true);
  };

  // Edit bill functions
  const addProductToBill = (productId: string) => {
    if (!editBillData) return;
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = editBillData.items.find(i => i.productId === productId);
    if (existingItem) {
      updateItemQuantity(productId, existingItem.quantity + 1);
    } else {
      const newItem: BillItem = {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: 1,
        unitPrice: product.salePrice,
        discount: 0,
        total: product.salePrice,
      };
      setEditBillData({ ...editBillData, items: [...editBillData.items, newItem] });
    }
  };

  const removeItemFromBill = (productId: string) => {
    if (!editBillData) return;
    setEditBillData({ ...editBillData, items: editBillData.items.filter(i => i.productId !== productId) });
  };

  const updateItemQuantity = (productId: string, newQty: number) => {
    if (!editBillData || newQty < 1) return;
    setEditBillData({
      ...editBillData,
      items: editBillData.items.map(i => 
        i.productId === productId 
          ? { ...i, quantity: newQty, total: i.unitPrice * newQty }
          : i
      ),
    });
  };

  const recalculateTotals = useCallback((bill: Bill): Bill => {
    const subtotal = bill.items.reduce((s, i) => s + i.total, 0);
    const discountAmount = bill.discountType === 'percentage' 
      ? Math.round(subtotal * bill.discountValue / 100) 
      : bill.discountValue;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(afterDiscount * bill.taxRate / 100);
    const grandTotal = afterDiscount + taxAmount;
    
    return { ...bill, subtotal, discountAmount, taxAmount, grandTotal };
  }, []);

  const saveBillEdit = () => {
    if (!editBillData || !selectedBill) return;
    
    const recalculated = recalculateTotals(editBillData);
    const oldSnapshot = createBillSnapshot(selectedBill);
    const newSnapshot = createBillSnapshot(recalculated);
    const changes = calculateBillChanges(oldSnapshot, newSnapshot);
    const historyCount = getBillHistoryCount(selectedBill.id);
    
    addBillHistory({
      billId: selectedBill.id,
      version: historyCount + 1,
      modifiedBy: user!.id,
      modifiedByName: user!.fullName,
      modifiedByRole: user!.role,
      deviceName: getDeviceName(),
      previousData: oldSnapshot,
      newData: newSnapshot,
      changes,
      timestamp: new Date().toISOString(),
    });

    const newUpdateCount = selectedBill.updateCount + 1;
    updateBill(selectedBill.id, {
      ...recalculated,
      updateCount: newUpdateCount,
      updatedAt: new Date().toISOString(),
    });

    logAction('Bill Updated', `Bill ${selectedBill.billNumber} updated (edit #${newUpdateCount})`);
    notify('success', 'Bill updated successfully');
    setShowEditModal(false);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteBill = (bill: Bill) => {
    if (!isOwner) { notify('error', 'Only owner can delete bills'); return; }
    if (confirm(`Delete bill ${bill.billNumber}?`)) {
      deleteBill(bill.id);
      logAction('Bill Deleted', `Bill ${bill.billNumber} deleted`);
      notify('success', 'Bill deleted');
      setRefreshKey(k => k + 1);
    }
  };

  const viewHistory = (bill: Bill) => {
    setSelectedBill(bill);
    setShowHistoryModal(true);
  };

  const history = useMemo<BillHistory[]>(() => {
    if (!selectedBill) return [];
    return getBillHistory(selectedBill.id);
  }, [selectedBill, showHistoryModal, refreshKey]);

  const [productSearch, setProductSearch] = useState('');
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 10);
    const s = productSearch.toLowerCase();
    return allProducts.filter(p => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s));
  }, [allProducts, productSearch]);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={`${t('searchBills')} (${t('billNumber')}, ${t('customer')}, ${t('phone')})...`}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-slate-600">
          <FiFilter size={14} /> {t('filter')}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none">
            <option value="all">{t('all')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="void">{t('void')}</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none" placeholder={t('from')} />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none" placeholder={t('to')} />
        </div>
      )}

      {/* Bills Count & Pagination Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{filteredBills.length} {t('bills')}</p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('billNumber')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('customer')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('date')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('paymentMethod')}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t('amount')}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Edits</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {paginatedBills.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-primary-600 dark:text-primary-400">{bill.billNumber}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{bill.customerName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(bill.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 capitalize">{bill.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{sett.currency} {bill.grandTotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bill.updateCount >= 2 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                      {bill.updateCount}/2
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => viewBill(bill)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-500" title={t('view')}><FiEye size={14} /></button>
                      <button onClick={() => editBill(bill)} className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 ${!isOwner && bill.updateCount >= 2 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:text-primary-500'}`} title={t('edit')} disabled={!isOwner && bill.updateCount >= 2}><FiEdit2 size={14} /></button>
                      <button onClick={() => viewHistory(bill)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-purple-500" title={t('billHistory')}><FiClock size={14} /></button>
                      <button onClick={() => printBill(bill)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-green-500" title={t('print')}><FiPrinter size={14} /></button>
                      {isOwner && <button onClick={() => handleDeleteBill(bill)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-red-500" title={t('delete')}><FiTrash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {paginatedBills.map(bill => (
          <div key={bill.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-primary-600 dark:text-primary-400 text-sm">{bill.billNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bill.updateCount >= 2 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                {bill.updateCount}/2 edits
              </span>
            </div>
            <p className="text-sm text-gray-900 dark:text-white">{bill.customerName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(bill.createdAt).toLocaleString()}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{sett.currency} {bill.grandTotal.toLocaleString()}</span>
              <div className="flex gap-1">
                <button onClick={() => viewBill(bill)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500"><FiEye size={14} /></button>
                <button onClick={() => editBill(bill)} className={`p-2 rounded-lg ${!isOwner && bill.updateCount >= 2 ? 'bg-gray-100 dark:bg-slate-700 text-gray-300' : 'bg-primary-50 dark:bg-primary-900/30 text-primary-500'}`} disabled={!isOwner && bill.updateCount >= 2}><FiEdit2 size={14} /></button>
                <button onClick={() => viewHistory(bill)} className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-500"><FiClock size={14} /></button>
                <button onClick={() => printBill(bill)} className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-500"><FiPrinter size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-40">
            <FiChevronLeft size={18} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) pageNum = i + 1;
            else if (page <= 3) pageNum = i + 1;
            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = page - 2 + i;
            return (
              <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page === pageNum ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                {pageNum}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-40">
            <FiChevronRight size={18} />
          </button>
        </div>
      )}

      {filteredBills.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FiSearch size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('noData')}</p>
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`${t('view')} - ${selectedBill?.billNumber || ''}`} size="md">
        {selectedBill && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500 dark:text-gray-400">{t('billNumber')}:</span><p className="font-medium text-gray-900 dark:text-white">{selectedBill.billNumber}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">{t('date')}:</span><p className="font-medium text-gray-900 dark:text-white">{new Date(selectedBill.createdAt).toLocaleString()}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">{t('customer')}:</span><p className="font-medium text-gray-900 dark:text-white">{selectedBill.customerName}</p></div>
              <div><span className="text-gray-500 dark:text-gray-400">{t('paymentMethod')}:</span><p className="font-medium text-gray-900 dark:text-white capitalize">{selectedBill.paymentMethod}</p></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-slate-700"><th className="text-left py-2">{t('productName')}</th><th className="text-center">{t('quantity')}</th><th className="text-right">{t('price')}</th><th className="text-right">{t('total')}</th></tr></thead>
              <tbody>
                {selectedBill.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-slate-700"><td className="py-2">{item.productName}</td><td className="text-center">{item.quantity}</td><td className="text-right">{item.unitPrice}</td><td className="text-right font-medium">{item.total}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-3 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">{t('subtotal')}</span><span>{sett.currency} {selectedBill.subtotal}</span></div>
              {selectedBill.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>{t('discount')}</span><span>-{sett.currency} {selectedBill.discountAmount}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">{t('tax')}</span><span>{sett.currency} {selectedBill.taxAmount}</span></div>
              <div className="flex justify-between font-bold text-lg pt-1 border-t border-gray-200 dark:border-slate-700"><span>{t('grandTotal')}</span><span className="text-primary-600">{sett.currency} {selectedBill.grandTotal}</span></div>
            </div>
            <p className="text-xs text-gray-500">Edits: {selectedBill.updateCount}/2 • Cashier: {selectedBill.employeeName}</p>
          </div>
        )}
      </Modal>

      {/* Full Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`${t('edit')} - ${selectedBill?.billNumber || ''}`} size="xl">
        {editBillData && selectedBill && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Product Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Add Products</h4>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addProductToBill(p.id)}
                    className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-100 dark:border-slate-600"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{sett.currency} {p.salePrice}</p>
                  </button>
                ))}
              </div>

              {/* Customer & Payment */}
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t('customerName')}</label>
                  <input type="text" value={editBillData.customerName} onChange={e => setEditBillData({ ...editBillData, customerName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t('customerPhone')}</label>
                  <input type="text" value={editBillData.customerPhone} onChange={e => setEditBillData({ ...editBillData, customerPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t('paymentMethod')}</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['cash', 'card', 'jazzcash', 'easypaisa'] as PaymentMethod[]).map(m => (
                      <button key={m} onClick={() => setEditBillData({ ...editBillData, paymentMethod: m })} className={`py-2 rounded-lg text-xs font-medium ${editBillData.paymentMethod === m ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">{t('discount')}</label>
                    <input type="number" value={editBillData.discountValue} onChange={e => setEditBillData({ ...editBillData, discountValue: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm outline-none" min="0" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">{t('tax')} %</label>
                    <input type="number" value={editBillData.taxRate} onChange={e => setEditBillData({ ...editBillData, taxRate: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm outline-none" min="0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Bill Items */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Bill Items ({editBillData.items.length})</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {editBillData.items.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No items in bill</p>
                ) : editBillData.items.map(item => (
                  <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">{sett.currency} {item.unitPrice} × {item.quantity} = {sett.currency} {item.total}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300">
                        <FiMinus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300">
                        <FiPlus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeItemFromBill(item.productId)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals Preview */}
              {(() => {
                const preview = recalculateTotals(editBillData);
                return (
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">{t('subtotal')}</span><span>{sett.currency} {preview.subtotal}</span></div>
                    {preview.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>{t('discount')}</span><span>-{sett.currency} {preview.discountAmount}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-500">{t('tax')} ({preview.taxRate}%)</span><span>{sett.currency} {preview.taxAmount}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-1 border-t border-gray-200 dark:border-slate-700"><span>{t('grandTotal')}</span><span className="text-primary-600">{sett.currency} {preview.grandTotal}</span></div>
                  </div>
                );
              })()}

              <p className="text-xs text-gray-500">
                Edit #{selectedBill.updateCount + 1} {!isOwner && selectedBill.updateCount >= 1 ? '⚠️ Last allowed edit' : ''}
              </p>

              <div className="flex gap-3 pt-3">
                <button onClick={saveBillEdit} disabled={editBillData.items.length === 0} className="flex-1 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:opacity-40">{t('save')}</button>
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl">{t('cancel')}</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* History Modal with Timeline */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`${t('billHistory')} - ${selectedBill?.billNumber || ''}`} size="lg">
        {selectedBill && (
          <div className="space-y-4">
            {/* Timeline Header */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">Bill Created</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{new Date(selectedBill.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-green-500">By {selectedBill.employeeName}</p>
                </div>
              </div>
            </div>

            {history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No edits have been made to this bill</p>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700"></div>
                
                {history.map((h, idx) => (
                  <div key={h.id} className="relative pl-12 pb-6">
                    {/* Timeline Dot */}
                    <div className="absolute left-3 w-5 h-5 rounded-full bg-primary-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold">
                      {idx + 1}
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">Edit #{h.version}</span>
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 capitalize">{h.modifiedByRole}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div><span className="text-gray-500">Modified By:</span> <span className="font-medium">{h.modifiedByName}</span></div>
                        <div><span className="text-gray-500">Device:</span> <span className="font-medium">{h.deviceName}</span></div>
                      </div>

                      {/* Changes Summary */}
                      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2 text-sm">
                        {h.changes.addedItems.length > 0 && (
                          <div className="text-green-600 dark:text-green-400">
                            <span className="font-medium">Added:</span> {h.changes.addedItems.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                          </div>
                        )}
                        {h.changes.removedItems.length > 0 && (
                          <div className="text-red-600 dark:text-red-400">
                            <span className="font-medium">Removed:</span> {h.changes.removedItems.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                          </div>
                        )}
                        {h.changes.quantityChanges.length > 0 && (
                          <div className="text-yellow-600 dark:text-yellow-400">
                            <span className="font-medium">Quantity Changed:</span> {h.changes.quantityChanges.map(i => `${i.name} (${i.from} → ${i.to})`).join(', ')}
                          </div>
                        )}
                        {h.changes.customerChanged && (
                          <div className="text-blue-600 dark:text-blue-400">
                            <span className="font-medium">Customer:</span> {h.changes.previousCustomer} → {h.changes.newCustomer}
                          </div>
                        )}
                        {h.changes.paymentMethodChanged && (
                          <div className="text-purple-600 dark:text-purple-400">
                            <span className="font-medium">Payment:</span> {h.changes.previousPaymentMethod} → {h.changes.newPaymentMethod}
                          </div>
                        )}
                        {h.changes.discountChanged && (
                          <div className="text-orange-600 dark:text-orange-400">
                            <span className="font-medium">Discount:</span> {sett.currency} {h.changes.previousDiscount} → {sett.currency} {h.changes.newDiscount}
                          </div>
                        )}
                        {h.changes.totalChanged && (
                          <div className="text-gray-900 dark:text-white font-semibold">
                            <span className="font-medium">Total:</span> {sett.currency} {h.changes.previousTotal} → {sett.currency} {h.changes.newTotal}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Current Version */}
                <div className="relative pl-12">
                  <div className="absolute left-3 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800"></div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                    <p className="text-green-800 dark:text-green-300 font-medium">Current Version</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Total: {sett.currency} {selectedBill.grandTotal}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Print Modal - Uses Professional Receipt Preview */}
      {showPrintModal && selectedBill && (
        <ReceiptPreview 
          bill={selectedBill} 
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
