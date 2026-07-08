import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { getAuditLogs } from '../store/database';
import { FiSearch, FiActivity, FiFilter } from 'react-icons/fi';

export default function AuditLogsPage() {
  const { t } = useApp();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const logs = useMemo(() => getAuditLogs().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), []);

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(l => l.action.toLowerCase().includes(s) || l.details.toLowerCase().includes(s) || l.userName.toLowerCase().includes(s));
    }
    if (dateFrom) filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(dateFrom));
    if (dateTo) {
      const to = new Date(dateTo); to.setDate(to.getDate() + 1);
      filtered = filtered.filter(l => new Date(l.timestamp) < to);
    }
    return filtered;
  }, [logs, search, dateFrom, dateTo]);

  const actionColors: Record<string, string> = {
    'Login': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'Logout': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
    'Bill Created': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'Bill Updated': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'Bill Deleted': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    'Product Created': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    'Product Updated': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    'Product Deleted': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${t('search')} ${t('auditLogs')}...`}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
          <FiFilter size={14} /> {t('filter')}
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-2 flex-wrap p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none" />
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">{filteredLogs.length} log entries</p>

      {/* Logs */}
      <div className="space-y-2">
        {filteredLogs.map(log => (
          <div key={log.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-start gap-3 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
              {log.userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-gray-900 dark:text-white text-sm">{log.userName}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                  {log.action}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{log.details}</p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FiActivity size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('noData')}</p>
        </div>
      )}
    </div>
  );
}
