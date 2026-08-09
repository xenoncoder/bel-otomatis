import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, Toaster, Toast } from "@chakra-ui/react";
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
            <Toast.Root key={toast.id}>
              <Toast.Indicator />
              <Toast.Title>{toast.title}</Toast.Title>
              {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
              <Toast.CloseTrigger />
            </Toast.Root>
          )}
        </Toaster>
      </ChakraProvider>
    </ThemeProvider>
  </React.StrictMode>
);
