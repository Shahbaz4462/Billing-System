import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, Settings, Language, ThemeMode, Notification } from '../types';
import { translations, type TranslationKey } from '../i18n/translations';
import { getSettings, updateSettings as updateSettingsDB, addAuditLog } from './database';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  settings: Settings;
  refreshSettings: () => void;
  updateSettingsCtx: (data: Partial<Settings>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  notifications: Notification[];
  notify: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logAction: (action: string, details: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>(getSettings());
  const [language, setLanguageState] = useState<Language>(settings.language);
  const [theme, setThemeState] = useState<ThemeMode>(settings.theme);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshSettings = useCallback(() => {
    setSettings(getSettings());
  }, []);

  const updateSettingsCtx = useCallback((data: Partial<Settings>) => {
    updateSettingsDB(data);
    refreshSettings();
    if (data.language) setLanguageState(data.language);
    if (data.theme) setThemeState(data.theme);
  }, [refreshSettings]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    updateSettingsDB({ language: lang });
    refreshSettings();
  }, [refreshSettings]);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    updateSettingsDB({ theme: t });
    refreshSettings();
  }, [refreshSettings]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  const isRTL = language === 'ur';

  const notify = useCallback((type: Notification['type'], message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, message, timestamp: Date.now() };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const logAction = useCallback((action: string, details: string) => {
    if (user) {
      addAuditLog({ userId: user.id, userName: user.fullName, action, details });
    }
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.classList.remove('rtl');
    }
  }, [isRTL]);

  return (
    <AppContext.Provider value={{
      user, setUser, settings, refreshSettings, updateSettingsCtx,
      language, setLanguage, theme, setTheme, t, isRTL,
      notifications, notify, removeNotification,
      sidebarOpen, setSidebarOpen, logAction
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
