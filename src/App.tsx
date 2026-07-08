import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { generateSampleBills } from './store/database';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Notifications from './components/Notifications';
import DashboardPage from './pages/DashboardPage';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import BillsPage from './pages/BillsPage';
import EmployeesPage from './pages/EmployeesPage';
import ApprovalsPage from './pages/ApprovalsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { user } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    generateSampleBills();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'owner') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('billing');
      }
    }
  }, [user]);

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return user.role === 'owner' ? <DashboardPage /> : <BillingPage />;
      case 'billing': return <BillingPage />;
      case 'inventory': return <InventoryPage />;
      case 'bills': return <BillsPage />;
      case 'employees': return user.role === 'owner' ? <EmployeesPage /> : <BillingPage />;
      case 'approvals': return <ApprovalsPage />;
      case 'audit': return user.role === 'owner' ? <AuditLogsPage /> : <BillingPage />;
      case 'settings': return <SettingsPage />;
      default: return <BillingPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Notifications />
    </AppProvider>
  );
}
