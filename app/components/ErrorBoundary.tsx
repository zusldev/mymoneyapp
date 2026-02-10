"use client";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <span className="material-icons-round text-3xl text-red-400">error_outline</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Algo salió mal</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                        Ha ocurrido un error inesperado. Intenta recargar la página.
                    </p>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                        className="px-5 py-2.5 bg-[#2badee] hover:bg-[#1a8cb5] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#2badee]/20 active:scale-[0.97]"
                    >
                        Recargar
                    </button>
                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <pre className="mt-4 max-w-xl text-left text-xs text-red-400 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl overflow-auto border border-red-200 dark:border-red-800">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
