import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export const GlassModal = ({ isOpen, onClose, title, children, footer }: any) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative glass-panel w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-[sw-slideDown_0.2s_ease-out]">
        <div className="flex items-center justify-between p-5 border-b border-white/10 dark:border-white/5">
          <h2 className="text-xl font-heading font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="p-5 border-t border-white/10 dark:border-white/5 flex justify-end gap-3 bg-black/5 dark:bg-white/5 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
