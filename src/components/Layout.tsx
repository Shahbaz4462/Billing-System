import { type ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import { FiMenu, FiX, FiHome, FiShoppingCart, FiPackage, FiFileText, FiUsers, FiCheckSquare, FiActivity, FiSettings, FiLogOut, FiSun, FiMoon, FiGlobe } from 'react-icons/fi';
import { GiCupcake } from 'react-icons/gi';
import { getInventoryRequests } from '../store/database';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, setUser, t, theme, setTheme, language, setLanguage, notify, logAction, sidebarOpen, setSidebarOpen, settings } = useApp();
  const isOwner = user?.role === 'owner';
  const pendingApprovals = isOwner ? getInventoryRequests().filter(r => r.status === 'pending').length : 0;

  const navItems = [
    ...(isOwner ? [{ id: 'dashboard', label: t('dashboard'), icon: FiHome }] : []),
    { id: 'billing', label: t('billing'), icon: FiShoppingCart },
    { id: 'inventory', label: t('inventory'), icon: FiPackage },
    { id: 'bills', label: t('bills'), icon: FiFileText },
    ...(isOwner ? [
      { id: 'employees', label: t('employees'), icon: FiUsers },
      { id: 'approvals', label: t('approvals'), icon: FiCheckSquare, badge: pendingApprovals },
      { id: 'audit', label: t('auditLogs'), icon: FiActivity },
    ] : [
      { id: 'approvals', label: t('approvals'), icon: FiCheckSquare },
    ]),
    { id: 'settings', label: t('settings'), icon: FiSettings },
  ];

  const handleLogout = () => {
    logAction('Logout', `${user?.fullName} logged out`);
    setUser(null);
    notify('info', 'Logged out successfully');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-orange-50 dark:from-slate-800 dark:to-slate-800">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <GiCupcake size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">{settings.bakeryName}</h2>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium capitalize">{user?.role}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
            <FiX size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 dark:border-slate-700 p-3 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <FiLogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            <FiMenu size={22} />
          </button>

          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
            {navItems.find(n => n.id === currentPage)?.label || ''}
          </h1>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              title={language === 'en' ? 'اردو' : 'English'}
            >
              <FiGlobe size={16} />
              <span className="hidden sm:inline text-xs font-medium">{language === 'en' ? 'اردو' : 'EN'}</span>
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
