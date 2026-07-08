import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { getUsers, addUser, updateUser, deleteUser, addEmployeePayment, getAuditLogs, getEmployeeSalaryStatus } from '../store/database';
import type { User, EmployeePayment } from '../types';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiDollarSign, FiActivity, FiKey, FiSearch, FiCreditCard, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

type PaymentType = 'salary' | 'advance' | 'bonus' | 'deduction' | 'advance_return';

export default function EmployeesPage() {
  const { t, notify, logAction, settings } = useApp();
  const cur = settings.currency;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const users = useMemo(() => getUsers().filter(u => u.role === 'employee'), [refreshKey]);
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter(u => u.fullName.toLowerCase().includes(s) || u.username.toLowerCase().includes(s) || u.phone.includes(s));
  }, [users, search]);

  const [form, setForm] = useState<Partial<User> & { enableLogin?: boolean }>({});

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setForm({ ...user, enableLogin: user.hasSystemAccess });
    } else {
      setEditingUser(null);
      setForm({ 
        role: 'employee', 
        status: 'active', 
        salary: 0, 
        joiningDate: new Date().toISOString().split('T')[0],
        hasSystemAccess: false,
        totalAdvance: 0,
        enableLogin: false,
      });
    }
    setShowModal(true);
  };

  const saveUser = () => {
    if (!form.fullName) { notify('error', 'Name required'); return; }
    
    // If login is enabled, username and password are required
    if (form.enableLogin && (!form.username || (!editingUser && !form.password))) {
      notify('error', 'Username and password required for system access');
      return;
    }
    
    const userData = {
      ...form,
      hasSystemAccess: form.enableLogin || false,
      username: form.enableLogin ? form.username : '',
      password: form.enableLogin ? form.password : '',
    };
    
    if (editingUser) {
      updateUser(editingUser.id, userData);
      logAction('Employee Updated', `Updated employee: ${form.fullName}`);
      notify('success', 'Employee updated');
    } else {
      addUser(userData as Omit<User, 'id'>);
      logAction('Employee Created', `Created employee: ${form.fullName}`);
      notify('success', 'Employee created');
    }
    setShowModal(false);
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Delete employee "${user.fullName}"?`)) {
      deleteUser(user.id);
      logAction('Employee Deleted', `Deleted employee: ${user.fullName}`);
      notify('success', 'Employee deleted');
      setRefreshKey(k => k + 1);
    }
  };

  const [payForm, setPayForm] = useState<Partial<EmployeePayment>>({});
  const openPaymentModal = (emp: User) => {
    setSelectedEmployee(emp);
    setPayForm({ 
      employeeId: emp.id, 
      employeeName: emp.fullName, 
      amount: emp.salary, 
      paymentDate: new Date().toISOString().split('T')[0], 
      paymentType: 'salary', 
      notes: '' 
    });
    setShowPaymentModal(true);
  };

  const savePayment = () => {
    if (!payForm.amount || payForm.amount <= 0) { notify('error', 'Valid amount required'); return; }
    addEmployeePayment(payForm as Omit<EmployeePayment, 'id'>);
    logAction('Payment Recorded', `${payForm.paymentType} payment of ${cur} ${payForm.amount} to ${payForm.employeeName}`);
    notify('success', 'Payment recorded');
    setShowPaymentModal(false);
    setRefreshKey(k => k + 1);
  };

  const viewProfile = (emp: User) => {
    setSelectedEmployee(emp);
    setShowProfileModal(true);
  };

  const salaryStatus = useMemo(() => {
    if (!selectedEmployee) return null;
    return getEmployeeSalaryStatus(selectedEmployee.id);
  }, [selectedEmployee, showProfileModal, refreshKey]);

  const logs = useMemo(() => {
    if (!selectedEmployee) return [];
    return getAuditLogs().filter(l => l.userId === selectedEmployee.id).slice(-10).reverse();
  }, [selectedEmployee, showProfileModal]);

  const [newPass, setNewPass] = useState('');
  const openResetModal = (emp: User) => {
    setSelectedEmployee(emp);
    setNewPass('');
    setShowResetModal(true);
  };

  const resetPassword = () => {
    if (!newPass || newPass.length < 4) { notify('error', 'Password must be at least 4 characters'); return; }
    updateUser(selectedEmployee!.id, { password: newPass });
    logAction('Password Reset', `Reset password for ${selectedEmployee!.fullName}`);
    notify('success', 'Password reset successfully');
    setShowResetModal(false);
  };

  const paymentTypeLabels: Record<PaymentType, { label: string; color: string; icon: string }> = {
    salary: { label: 'Salary', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '💰' },
    advance: { label: 'Advance', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '📤' },
    bonus: { label: 'Bonus', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '🎁' },
    deduction: { label: 'Deduction', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '📉' },
    advance_return: { label: 'Advance Return', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '📥' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')} ${t('employees')}...`} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <button onClick={() => openModal()} className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 flex items-center gap-1.5 transition-all">
          <FiPlus size={16} /> {t('addEmployee')}
        </button>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(emp => {
          return (
            <div key={emp.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-xl transition-all hover:border-primary-200 dark:hover:border-primary-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {emp.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">{emp.fullName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {emp.hasSystemAccess ? `@${emp.username}` : '(No login)'}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                  {emp.status}
                </span>
              </div>
              
              {/* Salary Info */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                  <p className="text-xs text-green-600 dark:text-green-400">Monthly Salary</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">{cur} {emp.salary.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Advance</p>
                  <p className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{cur} {(emp.totalAdvance || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <p className="flex items-center gap-2">📞 {emp.phone || '-'}</p>
                <p className="flex items-center gap-2">📅 Joined: {emp.joiningDate}</p>
              </div>
              
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => viewProfile(emp)} className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1 transition-all">
                  <FiUser size={12} /> Profile
                </button>
                <button onClick={() => openPaymentModal(emp)} className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center justify-center gap-1 transition-all">
                  <FiDollarSign size={12} /> Pay
                </button>
                <button onClick={() => openModal(emp)} className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">
                  <FiEdit2 size={14} />
                </button>
                {emp.hasSystemAccess && (
                  <button onClick={() => openResetModal(emp)} className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all">
                    <FiKey size={14} />
                  </button>
                )}
                <button onClick={() => handleDelete(emp)} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FiUser size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('noData')}</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit Employee' : t('addEmployee')} size="lg">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fullName')} *</label>
              <input type="text" value={form.fullName || ''} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
              <input type="text" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')}</label>
              <input type="text" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('joiningDate')}</label>
              <input type="date" value={form.joiningDate || ''} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('salary')}</label>
              <input type="number" value={form.salary || ''} onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
              <select value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none">
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
          </div>

          {/* System Access Toggle */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableLogin || false}
                onChange={e => setForm(f => ({ ...f, enableLogin: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Enable System Login</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Allow this employee to login and use the billing system</p>
              </div>
            </label>
          </div>

          {/* Login Credentials (only if enabled) */}
          {form.enableLogin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('username')} *</label>
                <input type="text" value={form.username || ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')} *</label>
                  <input type="password" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={saveUser} className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 transition-all">{t('save')}</button>
          <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">{t('cancel')}</button>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={`${t('recordPayment')} - ${selectedEmployee?.fullName || ''}`} size="md">
        <div className="space-y-4">
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentType')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(paymentTypeLabels) as PaymentType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setPayForm(f => ({ ...f, paymentType: type }))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border-2 transition-all ${
                    payForm.paymentType === type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {paymentTypeLabels[type].icon} {paymentTypeLabels[type].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('amount')}</label>
            <input type="number" value={payForm.amount || ''} onChange={e => setPayForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('date')}</label>
            <input type="date" value={payForm.paymentDate || ''} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notes')}</label>
            <textarea value={payForm.notes || ''} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Optional notes..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={savePayment} className="flex-1 py-3 bg-gradient-to-r from-success-500 to-success-600 text-white font-semibold rounded-xl hover:from-success-600 hover:to-success-700 shadow-lg shadow-success-500/30 transition-all">{t('save')}</button>
          <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">{t('cancel')}</button>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title={`${selectedEmployee?.fullName || ''} - Profile`} size="xl">
        {selectedEmployee && salaryStatus && (
          <div className="space-y-6">
            {/* Salary Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <FiDollarSign className="text-green-500" size={16} />
                  <span className="text-xs text-green-600 dark:text-green-400">Monthly Salary</span>
                </div>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">{cur} {salaryStatus.monthlySalary.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <FiCreditCard className="text-blue-500" size={16} />
                  <span className="text-xs text-blue-600 dark:text-blue-400">Paid This Month</span>
                </div>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{cur} {salaryStatus.totalPaidThisMonth.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-1">
                  <FiAlertCircle className="text-yellow-500" size={16} />
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">Total Advance</span>
                </div>
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{cur} {salaryStatus.totalAdvance.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <FiTrendingUp className="text-purple-500" size={16} />
                  <span className="text-xs text-purple-600 dark:text-purple-400">Remaining</span>
                </div>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{cur} {salaryStatus.remainingSalary.toLocaleString()}</p>
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                <p className="text-gray-500 dark:text-gray-400 text-xs">{t('phone')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEmployee.phone || '-'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                <p className="text-gray-500 dark:text-gray-400 text-xs">{t('joiningDate')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEmployee.joiningDate}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                <p className="text-gray-500 dark:text-gray-400 text-xs">System Access</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedEmployee.hasSystemAccess ? `@${selectedEmployee.username}` : 'No Login'}</p>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiDollarSign size={16} /> Payment History
              </h4>
              {salaryStatus.payments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{t('noData')}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {salaryStatus.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{paymentTypeLabels[p.paymentType as PaymentType]?.icon || '💵'}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{cur} {p.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{paymentTypeLabels[p.paymentType as PaymentType]?.label || p.paymentType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(p.paymentDate).toLocaleDateString()}</p>
                        {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiActivity size={16} /> Activity Log
              </h4>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{t('noData')}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {logs.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-2 text-sm border-b border-gray-100 dark:border-slate-700 last:border-0">
                      <div>
                        <p className="text-gray-900 dark:text-white">{l.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{l.details}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title={`${t('resetPassword')} - ${selectedEmployee?.fullName || ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('newPassword')}</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 4 characters" className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={resetPassword} className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 transition-all">{t('save')}</button>
          <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">{t('cancel')}</button>
        </div>
      </Modal>
    </div>
  );
}
