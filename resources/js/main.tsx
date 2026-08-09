import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { LangProvider } from "./lib/i18n";
import { ThemeColorProvider } from "./lib/theme-color";
import { ToastProvider } from "./components/ui/ToastProvider";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeColorProvider>
          <LangProvider>
            <ToastProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ToastProvider>
          </LangProvider>
        </ThemeColorProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
