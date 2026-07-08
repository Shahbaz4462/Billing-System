import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { getInventoryRequests, updateInventoryRequest, updateProduct, getProductById } from '../store/database';
import type { InventoryRequest } from '../types';
import Modal from '../components/Modal';
import { FiCheck, FiX, FiPackage } from 'react-icons/fi';

export default function ApprovalsPage() {
  const { user, t, notify, logAction } = useApp();
  const isOwner = user?.role === 'owner';
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const requests = useMemo(() => {
    let reqs = getInventoryRequests();
    if (!isOwner) reqs = reqs.filter(r => r.employeeId === user?.id);
    return reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [refreshKey, isOwner, user]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleApprove = (req: InventoryRequest) => {
    if (req.requestType === 'increase') {
      const prod = getProductById(req.productId);
      if (prod) updateProduct(prod.id, { quantity: prod.quantity + req.quantity });
    } else if (req.requestType === 'decrease') {
      const prod = getProductById(req.productId);
      if (prod) updateProduct(prod.id, { quantity: Math.max(0, prod.quantity - req.quantity) });
    }
    updateInventoryRequest(req.id, { status: 'approved', resolvedAt: new Date().toISOString() });
    logAction('Request Approved', `Approved ${req.requestType} request for ${req.productName} by ${req.employeeName}`);
    notify('success', 'Request approved');
    setRefreshKey(k => k + 1);
  };

  const openRejectModal = (req: InventoryRequest) => {
    setSelectedRequest(req);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = () => {
    if (!rejectReason) { notify('error', 'Please provide a reason'); return; }
    if (!selectedRequest) return;
    updateInventoryRequest(selectedRequest.id, { status: 'rejected', rejectionReason: rejectReason, resolvedAt: new Date().toISOString() });
    logAction('Request Rejected', `Rejected ${selectedRequest.requestType} request for ${selectedRequest.productName}`);
    notify('info', 'Request rejected');
    setShowRejectModal(false);
    setRefreshKey(k => k + 1);
  };

  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  const typeIcons = {
    increase: '📈',
    decrease: '📉',
    new_product: '🆕',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{isOwner ? t('pendingApprovals') : t('approvals')}</h2>
          {isOwner && pendingCount > 0 && (
            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{pendingCount} pending requests</p>
          )}
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}
            >
              {s === 'all' ? t('all') : s === 'pending' ? t('pending') : s === 'approved' ? t('approved') : t('rejected')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.map(req => (
          <div key={req.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{typeIcons[req.requestType]}</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{req.productName}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <div>
                    <span className="text-xs block text-gray-400 dark:text-gray-500">{t('requestType')}</span>
                    <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{req.requestType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400 dark:text-gray-500">{t('quantity')}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{req.quantity}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400 dark:text-gray-500">Employee</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{req.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400 dark:text-gray-500">{t('date')}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <strong>{t('reason')}:</strong> {req.reason}
                </p>
                {req.rejectionReason && (
                  <p className="text-sm text-red-500 mt-1 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    <strong>Rejection reason:</strong> {req.rejectionReason}
                  </p>
                )}
              </div>

              {isOwner && req.status === 'pending' && (
                <div className="flex sm:flex-col gap-2">
                  <button
                    onClick={() => handleApprove(req)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-success-500 text-white rounded-xl text-sm font-medium hover:bg-success-600 flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <FiCheck size={16} /> {t('approve')}
                  </button>
                  <button
                    onClick={() => openRejectModal(req)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-danger-500 text-white rounded-xl text-sm font-medium hover:bg-danger-600 flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <FiX size={16} /> {t('reject')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FiPackage size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('noData')}</p>
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title={`${t('reject')} Request`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Rejecting request for <strong>{selectedRequest?.productName}</strong> by {selectedRequest?.employeeName}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reason')} *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter reason for rejection..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleReject} className="flex-1 py-2.5 bg-danger-500 text-white font-medium rounded-xl hover:bg-danger-600">{t('reject')}</button>
          <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl">{t('cancel')}</button>
        </div>
      </Modal>
    </div>
  );
}
