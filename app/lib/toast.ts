"use client";

export type ToastLevel = "success" | "error" | "info";

export type ToastEventDetail = {
  id: string;
  level: ToastLevel;
  message: string;
  durationMs?: number;
};

const TOAST_EVENT = "mymoney:toast";

function emit(detail: Omit<ToastEventDetail, "id">): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...detail,
      },
    }),
  );
}

export function toastSuccess(message: string, durationMs = 2800): void {
  emit({ level: "success", message, durationMs });
}

export function toastError(message: string, durationMs = 4200): void {
  emit({ level: "error", message, durationMs });
}

export function toastInfo(message: string, durationMs = 3200): void {
  emit({ level: "info", message, durationMs });
}

export function getToastEventName(): string {
  return TOAST_EVENT;
}

