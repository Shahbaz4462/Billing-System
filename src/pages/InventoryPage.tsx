import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { getProducts, getCategories, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, addInventoryRequest } from '../store/database';
import type { Product, Category } from '../types';
import Modal from '../components/Modal';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiPackage, FiTag, FiAlertTriangle, FiSend } from 'react-icons/fi';

export default function InventoryPage() {
  const { user, t, notify, logAction } = useApp();
  const isOwner = user?.role === 'owner';
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<'products' | 'categories'>('products');

  const products = useMemo(() => getProducts(), [refreshKey]);
  const categories = useMemo(() => getCategories(), [refreshKey]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.categoryId === categoryFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s) || p.barcode.includes(s));
    }
    return filtered;
  }, [products, categoryFilter, search]);

  // Product Form
  const [pForm, setPForm] = useState<Partial<Product>>({});
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setPForm({ ...product });
    } else {
      setEditingProduct(null);
      setPForm({ categoryId: categories[0]?.id, unitType: 'piece', quantity: 0, minimumStock: 5, purchasePrice: 0, salePrice: 0 });
    }
    setShowProductModal(true);
  };

  const saveProduct = () => {
    if (!pForm.name || !pForm.code || !pForm.salePrice) {
      notify('error', 'Please fill required fields');
      return;
    }
    if (editingProduct) {
      updateProduct(editingProduct.id, pForm);
      logAction('Product Updated', `Updated product: ${pForm.name}`);
      notify('success', 'Product updated successfully');
    } else {
      addProduct(pForm as Omit<Product, 'id' | 'createdAt'>);
      logAction('Product Created', `Created product: ${pForm.name}`);
      notify('success', 'Product added successfully');
    }
    setShowProductModal(false);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Delete "${p.name}"?`)) {
      deleteProduct(p.id);
      logAction('Product Deleted', `Deleted product: ${p.name}`);
      notify('success', 'Product deleted');
      setRefreshKey(k => k + 1);
    }
  };

  // Category Form
  const [cForm, setCForm] = useState<Partial<Category>>({});
  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCForm({ ...cat });
    } else {
      setEditingCategory(null);
      setCForm({});
    }
    setShowCategoryModal(true);
  };

  const saveCategory = () => {
    if (!cForm.name) { notify('error', 'Category name required'); return; }
    if (editingCategory) {
      updateCategory(editingCategory.id, cForm);
      notify('success', 'Category updated');
    } else {
      addCategory(cForm as Omit<Category, 'id'>);
      notify('success', 'Category added');
    }
    setShowCategoryModal(false);
    setRefreshKey(k => k + 1);
  };

  // Request Form (Employee)
  const [reqForm, setReqForm] = useState({ productId: '', requestType: 'increase' as 'increase' | 'decrease' | 'new_product', quantity: 0, reason: '' });
  const openRequestModal = () => {
    setReqForm({ productId: products[0]?.id || '', requestType: 'increase', quantity: 0, reason: '' });
    setShowRequestModal(true);
  };

  const submitRequest = () => {
    if (!reqForm.reason) { notify('error', 'Please provide a reason'); return; }
    const prod = products.find(p => p.id === reqForm.productId);
    addInventoryRequest({
      employeeId: user!.id,
      employeeName: user!.fullName,
      productId: reqForm.productId,
      productName: prod?.name || 'New Product',
      requestType: reqForm.requestType,
      quantity: reqForm.quantity,
      reason: reqForm.reason,
    });
    logAction('Stock Request', `Requested ${reqForm.requestType} for ${prod?.name || 'new product'}`);
    notify('success', 'Request submitted for approval');
    setShowRequestModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'products' ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}
          >
            <FiPackage className="inline mr-1.5" size={14} /> {t('products')} ({products.length})
          </button>
          {isOwner && (
            <button
              onClick={() => setTab('categories')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'categories' ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}
            >
              <FiTag className="inline mr-1.5" size={14} /> {t('categories')} ({categories.length})
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isOwner && tab === 'products' && (
            <button onClick={() => openProductModal()} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 shadow-md flex items-center gap-1.5">
              <FiPlus size={16} /> {t('addProduct')}
            </button>
          )}
          {!isOwner && (
            <button onClick={openRequestModal} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 shadow-md flex items-center gap-1.5">
              <FiSend size={14} /> {t('requestStock')}
            </button>
          )}
          {isOwner && tab === 'categories' && (
            <button onClick={() => openCategoryModal()} className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 shadow-md flex items-center gap-1.5">
              <FiPlus size={16} /> {t('addCategory')}
            </button>
          )}
        </div>
      </div>

      {tab === 'products' && (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchProduct')}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="all">{t('all')} {t('categories')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Products Table / Cards */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('productName')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('productCode')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('category')}</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t('purchasePrice')}</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t('salePrice')}</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">{t('quantity')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">{t('expiryDate')}</th>
                    {isOwner && <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">{t('actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredProducts.map(p => {
                    const cat = categories.find(c => c.id === p.categoryId);
                    const isLow = p.quantity > 0 && p.quantity <= p.minimumStock;
                    const isOut = p.quantity === 0;
                    const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{p.nameUrdu}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.code}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{cat?.name || '-'}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{p.purchasePrice}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{p.salePrice}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isOut ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            isLow ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          }`}>
                            {isLow && <FiAlertTriangle size={10} />}
                            {p.quantity}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                          {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '-'}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => openProductModal(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                                <FiEdit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteProduct(p)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filteredProducts.map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              const isLow = p.quantity > 0 && p.quantity <= p.minimumStock;
              const isOut = p.quantity === 0;
              return (
                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.code} • {cat?.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isOut ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      isLow ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      Qty: {p.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Sale: </span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">Rs. {p.salePrice}</span>
                    </div>
                    {isOwner && (
                      <div className="flex gap-1.5">
                        <button onClick={() => openProductModal(p)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteProduct(p)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'categories' && isOwner && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{c.name}</h4>
                <div className="flex gap-1">
                  <button onClick={() => openCategoryModal(c)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"><FiEdit2 size={14} /></button>
                  <button onClick={() => { if (confirm('Delete?')) { deleteCategory(c.id); setRefreshKey(k => k + 1); notify('success', 'Category deleted'); } }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"><FiTrash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.nameUrdu}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{c.description}</p>
              <p className="text-xs text-primary-500 mt-2">{products.filter(p => p.categoryId === c.id).length} products</p>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title={editingProduct ? t('editProduct') : t('addProduct')} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('productName')} *</label>
            <input type="text" value={pForm.name || ''} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('urduName')}</label>
            <input type="text" value={pForm.nameUrdu || ''} onChange={e => setPForm(f => ({ ...f, nameUrdu: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" dir="rtl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('productCode')} *</label>
            <input type="text" value={pForm.code || ''} onChange={e => setPForm(f => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('barcode')}</label>
            <input type="text" value={pForm.barcode || ''} onChange={e => setPForm(f => ({ ...f, barcode: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
            <select value={pForm.categoryId || ''} onChange={e => setPForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('unitType')}</label>
            <select value={pForm.unitType || 'piece'} onChange={e => setPForm(f => ({ ...f, unitType: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none">
              <option value="piece">Piece</option>
              <option value="pack">Pack</option>
              <option value="kg">Kg</option>
              <option value="dozen">Dozen</option>
              <option value="cup">Cup</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchasePrice')} *</label>
            <input type="number" value={pForm.purchasePrice || ''} onChange={e => setPForm(f => ({ ...f, purchasePrice: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('salePrice')} *</label>
            <input type="number" value={pForm.salePrice || ''} onChange={e => setPForm(f => ({ ...f, salePrice: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('quantity')}</label>
            <input type="number" value={pForm.quantity ?? ''} onChange={e => setPForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('minimumStock')}</label>
            <input type="number" value={pForm.minimumStock || ''} onChange={e => setPForm(f => ({ ...f, minimumStock: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('supplierName')}</label>
            <input type="text" value={pForm.supplierName || ''} onChange={e => setPForm(f => ({ ...f, supplierName: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('batchNumber')}</label>
            <input type="text" value={pForm.batchNumber || ''} onChange={e => setPForm(f => ({ ...f, batchNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('expiryDate')}</label>
            <input type="date" value={pForm.expiryDate || ''} onChange={e => setPForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={saveProduct} className="flex-1 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600">{t('save')}</button>
          <button onClick={() => setShowProductModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200">{t('cancel')}</button>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editingCategory ? 'Edit Category' : t('addCategory')} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')}</label>
            <input type="text" value={cForm.name || ''} onChange={e => setCForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('urduName')}</label>
            <input type="text" value={cForm.nameUrdu || ''} onChange={e => setCForm(f => ({ ...f, nameUrdu: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" dir="rtl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
            <textarea value={cForm.description || ''} onChange={e => setCForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={saveCategory} className="flex-1 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600">{t('save')}</button>
          <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200">{t('cancel')}</button>
        </div>
      </Modal>

      {/* Request Modal (Employee) */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title={t('requestStock')} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('requestType')}</label>
            <select value={reqForm.requestType} onChange={e => setReqForm(f => ({ ...f, requestType: e.target.value as 'increase' | 'decrease' | 'new_product' }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none">
              <option value="increase">{t('increase')}</option>
              <option value="decrease">{t('decrease')}</option>
              <option value="new_product">{t('newProduct')}</option>
            </select>
          </div>
          {reqForm.requestType !== 'new_product' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('productName')}</label>
              <select value={reqForm.productId} onChange={e => setReqForm(f => ({ ...f, productId: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none">
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('quantity')}</label>
            <input type="number" value={reqForm.quantity || ''} onChange={e => setReqForm(f => ({ ...f, quantity: Number(e.target.value) }))} min="1" className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reason')} *</label>
            <textarea value={reqForm.reason} onChange={e => setReqForm(f => ({ ...f, reason: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={submitRequest} className="flex-1 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600">{t('save')}</button>
          <button onClick={() => setShowRequestModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200">{t('cancel')}</button>
        </div>
      </Modal>
    </div>
  );
}
