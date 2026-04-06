"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export interface ToastOptions {
  message: string;
  type?: "success" | "error";
  duration?: number;
}

interface ToastProps extends ToastOptions {
  onClose: () => void;
}

/** Standalone toast that auto-dismisses. Use via <Toast /> or the useToast hook. */
export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const isSuccess = type === "success";
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl
      border animate-in slide-in-from-bottom-4 text-sm font-medium
      ${isSuccess
        ? "bg-emerald-950 border-emerald-500/40 text-emerald-200"
        : "bg-red-950 border-red-500/40 text-red-200"
      }`}>
      {isSuccess
        ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
        : <XCircle size={18} className="text-red-400 flex-shrink-0" />
      }
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}

/** Simple hook to manage a single toast message. */
export function useToast() {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = (opts: ToastOptions) => setToast(opts);
  const closeToast = () => setToast(null);

  const ToastRenderer = toast
    ? <Toast {...toast} onClose={closeToast} />
    : null;

  return { showToast, ToastRenderer };
}
