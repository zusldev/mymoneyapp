"use client";

import { useEffect, useRef, ReactNode } from "react";

export function Modal({
    isOpen,
    onClose,
    title,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);

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

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1a262d] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-xl border border-slate-200/50 dark:border-slate-700/50 animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-[#1a262d]/95 backdrop-blur-sm rounded-t-2xl z-10">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                    <button
                        aria-label="Cerrar modal"
                        onClick={onClose}
                        className="p-2 rounded-lg touch-target focus-ring hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <span className="material-icons-round text-xl">close</span>
                    </button>
                </div>
                {/* Body */}
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
