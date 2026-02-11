"use client";

import { useEffect, useMemo, useState } from "react";
import { getToastEventName, ToastEventDetail } from "../lib/toast";

type ToastItem = ToastEventDetail & { createdAt: number };

const palette = {
  success: "bg-emerald-500/95 border-emerald-300/40",
  error: "bg-red-500/95 border-red-300/40",
  info: "bg-slate-900/92 border-slate-500/40",
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const eventName = useMemo(() => getToastEventName(), []);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ToastEventDetail>;
      const detail = customEvent.detail;
      const item: ToastItem = { ...detail, createdAt: Date.now() };

      setToasts((prev) => [...prev, item]);

      const timeout = detail.durationMs ?? 3200;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, timeout);
    };

    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName]);

  return (
    <div className="fixed z-[120] bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[360px] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-white shadow-lg backdrop-blur-md ${palette[toast.level]} animate-slide-up`}
        >
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

