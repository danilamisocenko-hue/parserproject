import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-full bg-red-950 text-red-500 font-mono p-10 flex-col gap-4 text-center">
          <h1 className="text-3xl font-bold">Ой, произошла ошибка!</h1>
          <p className="text-white max-w-2xl bg-black/50 p-6 rounded-xl border border-red-500/30 overflow-auto whitespace-pre-wrap text-left">
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </p>
          <button onClick={() => window.location.reload()} className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-white mt-4">
            Перезагрузить страницу
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
