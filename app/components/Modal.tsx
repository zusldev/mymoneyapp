"use client";

import { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";

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

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 glass-strong rounded-t-2xl z-10">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
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
