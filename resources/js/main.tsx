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
            <Toast.Root 
              key={toast.id} 
              bg={toast.type === "success" ? "var(--sw-green-light)" : toast.type === "error" ? "var(--sw-pink-light)" : "var(--sw-bg-panel)"}
              border="2px solid var(--sw-border-color)" 
              boxShadow="0.3rem 0.3rem 0 var(--sw-shadow-color)"
              borderRadius="var(--sw-radius)"
              p={3}
              color="var(--sw-fg)"
              fontFamily="'Comfortaa', sans-serif"
              fontWeight="700"
            >
              <Toast.Indicator color={toast.type === "success" ? "var(--sw-green-dark)" : toast.type === "error" ? "var(--sw-pink-dark)" : "var(--sw-purple-normal)"} />
              <Toast.Title color={toast.type === "success" ? "var(--sw-green-dark)" : toast.type === "error" ? "var(--sw-pink-dark)" : "var(--sw-fg)"}>{toast.title}</Toast.Title>
              {toast.description && <Toast.Description fontFamily="'IBM Plex Mono', monospace" fontSize="sm" color={toast.type === "success" ? "var(--sw-green-dark)" : toast.type === "error" ? "var(--sw-pink-dark)" : "var(--sw-fg-muted)"}>{toast.description}</Toast.Description>}
              <Toast.CloseTrigger color="var(--sw-fg)" _hover={{ bg: "transparent", transform: "scale(1.1)" }} />
            </Toast.Root>
          )}
        </Toaster>
      </ChakraProvider>
    </ThemeProvider>
  </React.StrictMode>
);
