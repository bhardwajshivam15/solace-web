import { useState } from "react";
import { Megaphone } from "lucide-react";
import { adminAnnouncements as seedAdminAnnouncements } from "../data/mockData";
import type { AdminAnnouncement } from "../types";

const audiences: AdminAnnouncement["audience"][] = ["All Users", "All Listeners", "Everyone"];

const audienceStyles: Record<string, string> = {
  "All Users": "bg-brand-50 text-brand-700",
  "All Listeners": "bg-amber-50 text-amber-600",
  Everyone: "bg-green-50 text-green-600",
};

export default function AdminNotifications() {
  const [announcements, setAnnouncements] = useState(seedAdminAnnouncements);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<AdminAnnouncement["audience"]>("Everyone");

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    const newAnnouncement: AdminAnnouncement = {
      id: `an-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      audience,
      sentAt: "Just now",
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setTitle("");
    setMessage("");
    setAudience("Everyone");
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Notifications</h1>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Send Announcement</p>
        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AdminAnnouncement["audience"])}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
            >
              {audiences.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={handleSend}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Megaphone className="h-4 w-4" />
              Send Announcement
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="rounded-2xl border border-gray-100 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-900">{announcement.title}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${audienceStyles[announcement.audience]}`}
              >
                {announcement.audience}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{announcement.message}</p>
            <p className="mt-3 text-xs text-gray-400">{announcement.sentAt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
