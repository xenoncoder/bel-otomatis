import React from "react";
import { useT } from "@/lib/i18n";
import { GlassCard, GlassButton } from "@/components/ui/GlassComponents";
import BackgroundOrnament from "./BackgroundOrnament";

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <BackgroundOrnament variant="normal" />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard className="flex flex-col items-center text-center gap-6 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
          </div>
          <div>
            <h1 className="text-2xl font-heading font-black text-gray-800 dark:text-gray-100 mb-2">
              {t("error.title")}
            </h1>
            <p className="font-body font-bold text-gray-500">
              {t("error.desc")}
            </p>
          </div>
          
          {error && (
            <pre className="w-full p-4 rounded-xl bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-body text-xs overflow-x-auto text-left border border-black/5 dark:border-white/5">
              {error.message}
            </pre>
          )}
          
          <GlassButton variant="primary" onClick={onReset} className="w-full">
            {t("error.backToDashboard")}
          </GlassButton>
        </GlassCard>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
