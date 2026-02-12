import { useEffect, useRef, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    hideHeader = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    hideHeader?: boolean;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 animate-fade-in backdrop-blur-sm" />

            {/* Modal - Bottom Sheet on Mobile, Card on Desktop */}
            <div className="relative w-full sm:max-w-lg bg-[#f2f2f7] dark:bg-[#1c1c1e] sm:rounded-2xl rounded-t-[28px] max-h-[94vh] sm:max-h-[90vh] overflow-hidden shadow-2xl ring-1 ring-black/5 animate-slide-up flex flex-col">

                {/* Default Header (can be hidden) */}
                {!hideHeader && (
                    <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#1a262d]/50 backdrop-blur-xl z-10 shrink-0">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                        <button
                            aria-label="Cerrar"
                            onClick={onClose}
                            className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-700"
                        >
                            <span className="material-icons-round text-lg">close</span>
                        </button>
                    </div>
                )}

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-safe">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
