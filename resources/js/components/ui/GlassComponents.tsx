import React from 'react';

export const GlassCard = ({ children, className = '', ...props }: any) => (
  <div className={`glass-panel p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const GlassButton = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "glass-btn flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-indigo-500/80 hover:bg-indigo-500 text-white border-indigo-400/50",
    success: "bg-emerald-500/80 hover:bg-emerald-500 text-white border-emerald-400/50",
    danger: "bg-rose-500/80 hover:bg-rose-500 text-white border-rose-400/50",
    warning: "bg-amber-500/80 hover:bg-amber-500 text-white border-amber-400/50",
    ghost: "bg-transparent hover:bg-white/10 dark:hover:bg-white/5 border-transparent text-gray-800 dark:text-gray-200",
    outline: "bg-transparent border-gray-400/50 text-gray-800 dark:text-gray-200 hover:bg-gray-400/20",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const GlassInput = React.forwardRef(({ className = '', ...props }: any, ref) => (
  <input ref={ref as any} className={`glass-input ${className}`} {...props} />
));

export const GlassSelect = React.forwardRef(({ children, className = '', ...props }: any, ref) => (
  <select ref={ref as any} className={`glass-input appearance-none ${className}`} {...props}>
    {children}
  </select>
));

export const GlassLabel = ({ children, className = '', ...props }: any) => (
  <label className={`block font-heading font-bold text-sm mb-1 text-gray-800 dark:text-gray-200 ${className}`} {...props}>
    {children}
  </label>
);

export const GlassBadge = ({ children, color = 'blue', className = '' }: any) => {
  const colors: any = {
    blue: "bg-blue-500/20 text-blue-800 dark:text-blue-200 border border-blue-500/30",
    green: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30",
    red: "bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/30",
    yellow: "bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30",
    purple: "bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};
