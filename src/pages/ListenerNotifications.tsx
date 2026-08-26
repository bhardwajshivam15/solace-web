import { useEffect, useState } from "react";
import { History, Wallet as WalletIcon, Bell, Headphones, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

type NotificationType = "session" | "wallet" | "system" | "listener";

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const iconMap: Record<NotificationType, typeof Bell> = {
  session: History,
  wallet: WalletIcon,
  system: Bell,
  listener: Headphones,
};

export default function ListenerNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ data: AppNotification[] }>("/listener/notifications", { token })
      .then((response) => setNotifications(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load notifications."))
      .finally(() => setLoading(false));
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.read) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiRequest(`/listener/notifications/${id}/read`, { method: "PATCH", token });
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    markRead(id);
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Notifications</h1>
        {unreadCount > 0 && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
            {unreadCount} unread
          </span>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-sm text-gray-400">Loading notifications…</p>}

      <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type];
          const expanded = expandedId === notification.id;
          return (
            <button
              key={notification.id}
              onClick={() => toggleExpanded(notification.id)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 ${
                notification.read ? "" : "bg-brand-50/40"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`min-w-0 font-medium text-ink-900 ${expanded ? "" : "truncate"}`}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  )}
                  <ChevronDown
                    className={`ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </div>
                <p className={`mt-0.5 text-sm text-gray-500 ${expanded ? "whitespace-pre-line break-words" : "truncate"}`}>
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}

        {!loading && notifications.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            You're all caught up — no notifications yet.
          </p>
        )}
      </div>
    </div>
  );
}
