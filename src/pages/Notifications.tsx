import { useState } from "react";
import { History, Wallet as WalletIcon, Bell, Headphones } from "lucide-react";
import { speakerNotifications } from "../data/mockData";
import type { AppNotification } from "../types";

const iconMap: Record<AppNotification["type"], typeof Bell> = {
  session: History,
  wallet: WalletIcon,
  system: Bell,
  listener: Headphones,
};

export default function Notifications() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>(speakerNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
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

      <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type];
          return (
            <button
              key={notification.id}
              onClick={() => markRead(notification.id)}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 ${
                notification.read ? "" : "bg-brand-50/40"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink-900">
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {notification.time}
                </p>
              </div>
            </button>
          );
        })}

        {notifications.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            You're all caught up — no notifications yet.
          </p>
        )}
      </div>
    </div>
  );
}
