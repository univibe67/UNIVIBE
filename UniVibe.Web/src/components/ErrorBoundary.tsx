import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import i18n from "../i18n";
import Button from "./ui/Button";

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Beklenmeyen arayüz hatası:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold text-ink-900">{i18n.t("UI_CrashTitle")}</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{i18n.t("UI_CrashDescription")}</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          {i18n.t("UI_Reload")}
        </Button>
      </main>
    );
  }
}
