import { Link } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";

export interface ChatToast {
  id: string;
  to: string;
  title: string;
  preview: string;
}

export default function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ChatToast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl transition-transform"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <MessageCircle className="h-4.5 w-4.5" />
          </div>
          <Link
            to={toast.to}
            onClick={() => onDismiss(toast.id)}
            className="min-w-0 flex-1"
          >
            <p className="truncate text-sm font-semibold text-ink-900">{toast.title}</p>
            <p className="truncate text-sm text-gray-500">{toast.preview}</p>
          </Link>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-gray-300 hover:text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
