import { useState } from 'react';
import { FiEye, FiEyeOff, FiUser, FiLock, FiGlobe } from 'react-icons/fi';
import { GiCupcake } from 'react-icons/gi';
import { useApp } from '../store/AppContext';
import { authenticateUser, getSettings } from '../store/database';

export default function LoginPage() {
  const { setUser, t, language, setLanguage, notify, logAction, theme, setTheme } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const settings = getSettings();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      const user = authenticateUser(username, password);
      if (user) {
        setUser(user);
        logAction('Login', `${user.fullName} logged in`);
        notify('success', `${t('welcome')}, ${user.fullName}!`);
        if (rememberMe) {
          localStorage.setItem('bakery_remember', JSON.stringify({ username }));
        }
      } else {
        setError(t('invalidCredentials'));
        notify('error', t('invalidCredentials'));
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-orange-50 to-amber-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ee7f21 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      </div>

      {/* Language & Theme Toggle */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-700/90 text-sm font-medium shadow-lg hover:shadow-xl transition-all backdrop-blur-sm border border-white/50 dark:border-slate-600"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-700/90 text-sm font-medium shadow-lg hover:shadow-xl transition-all backdrop-blur-sm border border-white/50 dark:border-slate-600"
        >
          <FiGlobe size={16} />
          {language === 'en' ? 'اردو' : 'English'}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-2xl shadow-primary-500/40 mb-6 animate-bounce">
            <GiCupcake size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{settings.bakeryName}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('loginSubtitle')}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 p-8 space-y-6 border border-white/50 dark:border-slate-700">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('username')}</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t('username')}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('password')}</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('password')}
                className="w-full pl-12 pr-14 py-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('rememberMe')}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-xl shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('loading')}
              </span>
            ) : t('login')}
          </button>


        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Bakery POS System v1.0 • Professional Billing Solution
        </p>
      </div>
    </div>
  );
}
