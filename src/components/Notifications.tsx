import { useApp } from '../store/AppContext';
import { FiX, FiCheck, FiAlertTriangle, FiInfo, FiAlertCircle } from 'react-icons/fi';

export default function Notifications() {
  const { notifications, removeNotification } = useApp();

  if (notifications.length === 0) return null;

  const icons = {
    success: <FiCheck size={18} />,
    error: <FiAlertCircle size={18} />,
    warning: <FiAlertTriangle size={18} />,
    info: <FiInfo size={18} />,
  };

  const colors = {
    success: 'bg-success-500 text-white',
    error: 'bg-danger-500 text-white',
    warning: 'bg-warning-500 text-white',
    info: 'bg-info-500 text-white',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`${colors[n.type]} rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 pointer-events-auto animate-slide-in`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          {icons[n.type]}
          <span className="flex-1 text-sm font-medium">{n.message}</span>
          <button onClick={() => removeNotification(n.id)} className="opacity-70 hover:opacity-100">
            <FiX size={16} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
