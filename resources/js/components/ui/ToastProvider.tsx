import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl flex gap-3 animate-[sw-slideDown_0.3s_ease-out]">
            <div className="mt-0.5">
              {t.type === 'success' && <FiCheckCircle className="text-emerald-500" size={20} />}
              {t.type === 'error' && <FiAlertCircle className="text-rose-500" size={20} />}
              {t.type === 'warning' && <FiAlertCircle className="text-amber-500" size={20} />}
              {t.type === 'info' && <FiInfo className="text-blue-500" size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="font-heading font-bold text-sm text-gray-900 dark:text-gray-100">{t.title}</h4>
              {t.description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t.description}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
              <FiX size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
