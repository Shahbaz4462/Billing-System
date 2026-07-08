import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { getBills, getProducts, getUsers, getInventoryRequests, getAuditLogs, getSalesAnalytics, getProductPerformance } from '../store/database';
import { FiTrendingUp, FiPackage, FiAlertTriangle, FiUsers, FiDollarSign, FiShoppingBag, FiActivity, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { t, settings } = useApp();
  const cur = settings.currency;
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');

  const stats = useMemo(() => {
    const bills = getBills().filter(b => b.status === 'completed');
    const products = getProducts();
    const users = getUsers();
    const requests = getInventoryRequests();
    const logs = getAuditLogs();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today); yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const todayBills = bills.filter(b => new Date(b.createdAt) >= today);
    const weekBills = bills.filter(b => new Date(b.createdAt) >= weekAgo);
    const monthBills = bills.filter(b => new Date(b.createdAt) >= monthAgo);
    const yearBills = bills.filter(b => new Date(b.createdAt) >= yearAgo);

    const sum = (arr: typeof bills) => arr.reduce((s, b) => s + b.grandTotal, 0);
    const profit = (arr: typeof bills) => {
      return arr.reduce((s, b) => {
        return s + b.items.reduce((ps, item) => {
          const prod = products.find(p => p.id === item.productId);
          const cost = prod ? prod.purchasePrice * item.quantity : 0;
          return ps + (item.total - cost);
        }, 0);
      }, 0);
    };

    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minimumStock);
    const outOfStock = products.filter(p => p.quantity === 0);
    const expired = products.filter(p => p.expiryDate && new Date(p.expiryDate) < now);
    const employees = users.filter(u => u.role === 'employee');
    const activeEmployees = employees.filter(u => u.status === 'active');

    // Last 7 days for chart
    const last7Days: { label: string; sales: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
      const dayBills = bills.filter(b => {
        const bd = new Date(b.createdAt);
        return bd >= d && bd < nextD;
      });
      last7Days.push({
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        sales: sum(dayBills),
        profit: profit(dayBills),
      });
    }

    // Product performance (top 5)
    const productSales: Record<string, number> = {};
    bills.forEach(b => {
      b.items.forEach(item => {
        productSales[item.productName] = (productSales[item.productName] || 0) + item.total;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Peak hours
    const hourSales: number[] = new Array(24).fill(0);
    bills.forEach(b => {
      const h = new Date(b.createdAt).getHours();
      hourSales[h] += b.grandTotal;
    });

    // Payment methods
    const paymentCounts: Record<string, number> = { cash: 0, card: 0, jazzcash: 0, easypaisa: 0 };
    bills.forEach(b => { paymentCounts[b.paymentMethod] = (paymentCounts[b.paymentMethod] || 0) + 1; });

    return {
      todaySales: sum(todayBills),
      weeklySales: sum(weekBills),
      monthlySales: sum(monthBills),
      yearlySales: sum(yearBills),
      dailyProfit: profit(todayBills),
      weeklyProfit: profit(weekBills),
      monthlyProfit: profit(monthBills),
      totalProducts: products.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      expired: expired.length,
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      last7Days,
      topProducts,
      hourSales,
      paymentCounts,
      recentLogs: logs.slice(-5).reverse(),
      lowStockProducts: lowStock.slice(0, 5),
    };
  }, []);

  // Custom date range analytics
  const customAnalytics = useMemo(() => {
    if (!dateFrom && !dateTo) return null;
    return getSalesAnalytics(dateFrom || undefined, dateTo || undefined);
  }, [dateFrom, dateTo]);

  // Product performance
  const productPerformance = useMemo(() => {
    return getProductPerformance(dateFrom || undefined, dateTo || undefined);
  }, [dateFrom, dateTo]);

  const statCards = [
    { label: t('todaySales'), value: `${cur} ${stats.todaySales.toLocaleString()}`, icon: FiDollarSign, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('weeklySales'), value: `${cur} ${stats.weeklySales.toLocaleString()}`, icon: FiTrendingUp, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('monthlySales'), value: `${cur} ${stats.monthlySales.toLocaleString()}`, icon: FiShoppingBag, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('dailyProfit'), value: `${cur} ${stats.dailyProfit.toLocaleString()}`, icon: FiTrendingUp, color: 'from-primary-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: t('totalProducts'), value: stats.totalProducts.toString(), icon: FiPackage, color: 'from-cyan-500 to-teal-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: t('lowStock'), value: stats.lowStock.toString(), icon: FiAlertTriangle, color: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: t('outOfStock'), value: stats.outOfStock.toString(), icon: FiPackage, color: 'from-red-500 to-rose-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: t('activeEmployees'), value: `${stats.activeEmployees}/${stats.totalEmployees}`, icon: FiUsers, color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
          📊 {t('dashboard')}
        </button>
        <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
          📦 {t('productPerformance')}
        </button>
      </div>

      {/* Custom Date Range */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-3">
          <FiCalendar className="text-primary-500" size={18} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Date Range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none" />
          <span className="text-gray-500">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-red-500 hover:text-red-700">Clear</button>
          )}
        </div>
        
        {/* Custom Analytics Results */}
        {customAnalytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400">Total Revenue</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{cur} {customAnalytics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">Total Profit</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{cur} {customAnalytics.totalProfit.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400">Total Bills</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{customAnalytics.totalBills}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-600 dark:text-orange-400">Avg Bill Value</p>
              <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{cur} {customAnalytics.averageBillValue.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className={`${card.bg} rounded-xl p-4 border border-gray-100 dark:border-slate-700/50`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Sales Trend */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('salesTrend')}</h3>
              <div className="h-60">
                <Line
                  data={{
                    labels: stats.last7Days.map(d => d.label),
                    datasets: [
                      {
                        label: 'Sales',
                        data: stats.last7Days.map(d => d.sales),
                        borderColor: '#ee7f21',
                        backgroundColor: 'rgba(238,127,33,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#ee7f21',
                      },
                      {
                        label: 'Profit',
                        data: stats.last7Days.map(d => d.profit),
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34,197,94,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#22c55e',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { color: textColor, font: { size: 11 } } } },
                    scales: {
                      x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                    },
                  }}
                />
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('productPerformance')}</h3>
              <div className="h-60">
                <Bar
                  data={{
                    labels: stats.topProducts.map(p => p[0].length > 12 ? p[0].substring(0, 12) + '...' : p[0]),
                    datasets: [{
                      label: 'Revenue',
                      data: stats.topProducts.map(p => p[1]),
                      backgroundColor: ['#ee7f21', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'],
                      borderRadius: 8,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
                      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                    },
                  }}
                />
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('peakHours')}</h3>
              <div className="h-60">
                <Bar
                  data={{
                    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                    datasets: [{
                      label: 'Sales',
                      data: stats.hourSales,
                      backgroundColor: stats.hourSales.map(v => v > 0 ? 'rgba(238,127,33,0.7)' : 'rgba(238,127,33,0.15)'),
                      borderRadius: 4,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 }, maxRotation: 45 } },
                      y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                    },
                  }}
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('paymentAnalysis')}</h3>
              <div className="h-60 flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: ['Cash', 'Card', 'JazzCash', 'EasyPaisa'],
                    datasets: [{
                      data: [stats.paymentCounts.cash, stats.paymentCounts.card, stats.paymentCounts.jazzcash, stats.paymentCounts.easypaisa],
                      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: textColor, font: { size: 11 }, padding: 12 } } },
                    cutout: '60%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiActivity size={16} /> {t('recentActivity')}
              </h3>
              {stats.recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('noData')}</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-bold flex-shrink-0">
                        {log.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{log.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.details}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stock Alerts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiAlertTriangle size={16} className="text-warning-500" /> {t('stockAlerts')}
              </h3>
              {stats.lowStockProducts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('noData')}</p>
              ) : (
                <div className="space-y-2">
                  {stats.lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-warning-50 dark:bg-yellow-900/20 border border-warning-500/20">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-warning-600 dark:text-yellow-400">{p.quantity} left</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Min: {p.minimumStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Product Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hot Selling */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3">
                <h4 className="text-white font-semibold flex items-center gap-2">🔥 Hot Selling Products</h4>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {productPerformance.filter(p => p.category === 'hot').map(p => (
                  <div key={p.productId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.productName}</p>
                      <p className="text-xs text-gray-500">{p.unitsSold} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{cur} {p.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Profit: {cur} {p.profit.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {productPerformance.filter(p => p.category === 'hot').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">{t('noData')}</p>
                )}
              </div>
            </div>

            {/* Average Selling */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-3">
                <h4 className="text-white font-semibold flex items-center gap-2">📊 Average Selling Products</h4>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {productPerformance.filter(p => p.category === 'average').map(p => (
                  <div key={p.productId} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.productName}</p>
                      <p className="text-xs text-gray-500">{p.unitsSold} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{cur} {p.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Profit: {cur} {p.profit.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {productPerformance.filter(p => p.category === 'average').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">{t('noData')}</p>
                )}
              </div>
            </div>

            {/* Low Selling */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
                <h4 className="text-white font-semibold flex items-center gap-2">📉 Low Selling Products</h4>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {productPerformance.filter(p => p.category === 'low').map(p => (
                  <div key={p.productId} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.productName}</p>
                      <p className="text-xs text-gray-500">{p.unitsSold} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{cur} {p.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Profit: {cur} {p.profit.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {productPerformance.filter(p => p.category === 'low').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">{t('noData')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Top 10 Products Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiBarChart2 size={16} /> Top 10 Products - Revenue Distribution
            </h3>
            <div className="h-72">
              <Bar
                data={{
                  labels: productPerformance.slice(0, 10).map(p => p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName),
                  datasets: [
                    {
                      label: 'Revenue',
                      data: productPerformance.slice(0, 10).map(p => p.revenue),
                      backgroundColor: 'rgba(238,127,33,0.8)',
                      borderRadius: 8,
                    },
                    {
                      label: 'Profit',
                      data: productPerformance.slice(0, 10).map(p => p.profit),
                      backgroundColor: 'rgba(34,197,94,0.8)',
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top', labels: { color: textColor } } },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor } },
                  },
                }}
              />
            </div>
          </div>

          {/* Profit Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* High Profit */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
                <h4 className="text-white font-semibold flex items-center gap-2">💰 Most Profitable</h4>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {productPerformance.filter(p => p.profitCategory === 'high').sort((a, b) => b.profit - a.profit).slice(0, 5).map(p => (
                  <div key={p.productId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.productName}</p>
                    <p className="text-sm font-bold text-green-600">{cur} {p.profit.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Average Profit */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3">
                <h4 className="text-white font-semibold flex items-center gap-2">📈 Average Profitable</h4>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {productPerformance.filter(p => p.profitCategory === 'average').sort((a, b) => b.profit - a.profit).slice(0, 5).map(p => (
                  <div key={p.productId} className="flex items-center justify-between p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.productName}</p>
                    <p className="text-sm font-bold text-cyan-600">{cur} {p.profit.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Profit */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-500 to-slate-500 px-4 py-3">
                <h4 className="text-white font-semibold flex items-center gap-2">⚠️ Low Profitable</h4>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {productPerformance.filter(p => p.profitCategory === 'low').sort((a, b) => b.profit - a.profit).slice(0, 5).map(p => (
                  <div key={p.productId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.productName}</p>
                    <p className="text-sm font-bold text-gray-600">{cur} {p.profit.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
