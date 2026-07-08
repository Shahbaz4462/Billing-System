import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { getSettings, updateSettings, createBackup, restoreBackup, resetDB } from '../store/database';
import type { Settings } from '../types';
import { FiSave, FiDownload, FiUpload, FiRefreshCw, FiGlobe, FiSun, FiMoon } from 'react-icons/fi';

export default function SettingsPage() {
  const { user, t, notify, logAction, setTheme, setLanguage, refreshSettings, theme, language } = useApp();
  const isOwner = user?.role === 'owner';
  const [form, setForm] = useState<Settings>(getSettings());
  const [activeTab, setActiveTab] = useState('bakery');

  useEffect(() => {
    setForm(getSettings());
  }, []);

  const handleSave = () => {
    updateSettings(form);
    refreshSettings();
    if (form.theme !== theme) setTheme(form.theme);
    if (form.language !== language) setLanguage(form.language);
    logAction('Settings Updated', 'System settings updated');
    notify('success', 'Settings saved successfully');
  };

  const handleBackup = () => {
    const data = createBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakery-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAction('Backup Created', 'Database backup created');
    notify('success', 'Backup downloaded');
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        if (restoreBackup(data)) {
          logAction('Backup Restored', 'Database restored from backup');
          notify('success', 'Backup restored. Please refresh.');
          setForm(getSettings());
          refreshSettings();
        } else {
          notify('error', 'Invalid backup file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('⚠️ This will reset ALL data to defaults. Are you sure?')) {
      resetDB();
      logAction('Database Reset', 'Database reset to defaults');
      notify('warning', 'Database reset to defaults. Please refresh.');
      setForm(getSettings());
      refreshSettings();
    }
  };

  const tabs = [
    { id: 'bakery', label: t('bakeryInfo'), icon: '🏪' },
    { id: 'receipt', label: t('receiptSettings'), icon: '🧾' },
    { id: 'system', label: t('systemSettings'), icon: '⚙️' },
    ...(isOwner ? [
      { id: 'backup', label: t('backup'), icon: '💾' },
      { id: 'network', label: 'Network / LAN', icon: '🖧' },
    ] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-primary-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
        {activeTab === 'bakery' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('bakeryInfo')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bakeryName')}</label>
                <input type="text" value={form.bakeryName} onChange={e => setForm(f => ({ ...f, bakeryName: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bakeryName')} (Urdu)</label>
                <input type="text" value={form.bakeryNameUrdu} onChange={e => setForm(f => ({ ...f, bakeryNameUrdu: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" dir="rtl" disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')}</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')} (Urdu)</label>
                <input type="text" value={form.addressUrdu} onChange={e => setForm(f => ({ ...f, addressUrdu: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" dir="rtl" disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Number</label>
                <input type="text" value={form.taxNumber} onChange={e => setForm(f => ({ ...f, taxNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receipt' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('receiptSettings')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Header</label>
                <input type="text" value={form.receiptHeader} onChange={e => setForm(f => ({ ...f, receiptHeader: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Footer</label>
                <input type="text" value={form.receiptFooter} onChange={e => setForm(f => ({ ...f, receiptFooter: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paper Size</label>
                <select value={form.paperSize} onChange={e => setForm(f => ({ ...f, paperSize: e.target.value as '58mm' | '80mm' }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none" disabled={!isOwner}>
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Printer Name</label>
                <input type="text" value={form.printerName} onChange={e => setForm(f => ({ ...f, printerName: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('systemSettings')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('theme')}</label>
                <div className="flex gap-2">
                  <button onClick={() => setForm(f => ({ ...f, theme: 'light' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${form.theme === 'light' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                    <FiSun size={16} /> {t('light')}
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, theme: 'dark' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${form.theme === 'dark' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                    <FiMoon size={16} /> {t('dark')}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('language')}</label>
                <div className="flex gap-2">
                  <button onClick={() => setForm(f => ({ ...f, language: 'en' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${form.language === 'en' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                    <FiGlobe size={16} /> {t('english')}
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, language: 'ur' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${form.language === 'ur' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                    <FiGlobe size={16} /> {t('urdu')}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('taxRate')}</label>
                <input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" max="100" disabled={!isOwner} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                <input type="text" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" disabled={!isOwner} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && isOwner && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('backup')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={handleBackup} className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-center group">
                <FiDownload size={32} className="mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-blue-700 dark:text-blue-400">{t('createBackup')}</p>
                <p className="text-xs text-blue-500/70 mt-1">Download as JSON</p>
              </button>
              <button onClick={handleRestore} className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-dashed border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all text-center group">
                <FiUpload size={32} className="mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-green-700 dark:text-green-400">{t('restoreBackup')}</p>
                <p className="text-xs text-green-500/70 mt-1">Upload JSON file</p>
              </button>
              <button onClick={handleReset} className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-center group">
                <FiRefreshCw size={32} className="mx-auto mb-3 text-red-500 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-red-700 dark:text-red-400">Reset Database</p>
                <p className="text-xs text-red-500/70 mt-1">⚠️ All data will be lost</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'network' && isOwner && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🖧 Offline Multi-Computer / LAN Setup</h3>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 System Architecture</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                For offline multi-computer synchronization, this system can be deployed with a local server architecture.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">🖥️ Main Server (Owner PC)</h5>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Host the database server</li>
                  <li>• Run Node.js backend</li>
                  <li>• SQLite/PostgreSQL database</li>
                  <li>• Acts as central data store</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">💻 Client PCs (Employee Counters)</h5>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Connect via local network (LAN)</li>
                  <li>• Access web interface via browser</li>
                  <li>• Real-time data sync</li>
                  <li>• No internet required</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-900/20 dark:to-orange-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
              <h5 className="font-semibold text-primary-800 dark:text-primary-300 mb-3">🚀 Deployment Steps</h5>
              <ol className="space-y-2 text-sm text-primary-700 dark:text-primary-400 list-decimal list-inside">
                <li>Install Node.js on the main server PC</li>
                <li>Set up SQLite/PostgreSQL database</li>
                <li>Configure local network (same subnet for all PCs)</li>
                <li>Run the backend server on the main PC</li>
                <li>Access from employee PCs via: <code className="bg-primary-100 dark:bg-primary-900/50 px-2 py-0.5 rounded">http://192.168.x.x:3000</code></li>
                <li>All transactions sync automatically</li>
              </ol>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Current Limitations</h5>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                This demo uses browser localStorage for data storage. For true multi-computer sync, 
                a backend server with database is required. Contact your system administrator for 
                enterprise deployment.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <h5 className="font-semibold text-green-800 dark:text-green-300 mb-2">✅ Scalability</h5>
              <div className="grid grid-cols-2 gap-4 text-sm text-green-700 dark:text-green-400">
                <div>
                  <p className="font-medium">Expected Daily Bills:</p>
                  <p className="text-lg font-bold">1,000+</p>
                </div>
                <div>
                  <p className="font-medium">Items per Bill:</p>
                  <p className="text-lg font-bold">~10</p>
                </div>
                <div>
                  <p className="font-medium">Annual Records:</p>
                  <p className="text-lg font-bold">365,000+ bills</p>
                </div>
                <div>
                  <p className="font-medium">Database Support:</p>
                  <p className="text-lg font-bold">SQLite / PostgreSQL</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
          <button onClick={handleSave} className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 shadow-lg shadow-primary-500/30 flex items-center gap-2">
            <FiSave size={16} /> {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
