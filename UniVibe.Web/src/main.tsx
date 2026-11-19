import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/onest/wght.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "./index.css";
import i18n from "./i18n";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";

const syncDocumentLanguage = (language: string) => {
  document.documentElement.lang = language.toLowerCase().startsWith("en") ? "en" : "tr";
};
syncDocumentLanguage(i18n.language);
i18n.on("languageChanged", syncDocumentLanguage);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
