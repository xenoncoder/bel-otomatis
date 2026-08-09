import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, Toaster, Toast, Box } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { system } from "./theme";
import { toaster } from "./lib/toaster";
import { LangProvider } from "./lib/i18n";
import { ThemeColorProvider } from "./lib/theme-color";
import "./styles/saweria.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ChakraProvider value={system}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeColorProvider>
            <LangProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </LangProvider>
          </ThemeColorProvider>
        </BrowserRouter>
        <Toaster toaster={toaster}>
          {(toast) => (
            <Toast.Root key={toast.id} className={`sw-toast sw-toast-${toast.type}`}>
              <Box display="flex" alignItems="flex-start" gap={3}>
                <Toast.Indicator className="sw-toast-icon" />
                <Box flex="1">
                  <Toast.Title className="sw-toast-title">{toast.title}</Toast.Title>
                  {toast.description && <Toast.Description className="sw-toast-desc">{toast.description}</Toast.Description>}
                </Box>
                <Toast.CloseTrigger className="sw-toast-close" />
              </Box>
            </Toast.Root>
          )}
        </Toaster>
      </ChakraProvider>
    </ThemeProvider>
  </React.StrictMode>
);
