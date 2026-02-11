"use client";

import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={open} onClose={loading ? () => undefined : onCancel} title={title}>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="touch-target focus-ring rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a262d] px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`touch-target focus-ring rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 ${
            destructive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-[#2badee] hover:bg-[#1a8cb5]"
          }`}
        >
          {loading ? "Procesando..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
