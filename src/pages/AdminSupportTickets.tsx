import { useState } from "react";
import { supportTickets as seedSupportTickets } from "../data/mockData";
import type { SupportTicket } from "../types";

const statusStyles: Record<string, string> = {
  Open: "bg-red-50 text-red-500",
  "In Progress": "bg-amber-50 text-amber-600",
  Resolved: "bg-green-50 text-green-600",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

const nextStatus: Record<SupportTicket["status"], SupportTicket["status"]> = {
  Open: "In Progress",
  "In Progress": "Resolved",
  Resolved: "Resolved",
};

const actionLabel: Record<SupportTicket["status"], string> = {
  Open: "Start Progress",
  "In Progress": "Mark Resolved",
  Resolved: "Resolved",
};

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState(seedSupportTickets);

  const advanceStatus = (id: string) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id ? { ...ticket, status: nextStatus[ticket.status] } : ticket,
      ),
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Support Tickets</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Open</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {tickets.filter((t) => t.status === "Open").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {tickets.filter((t) => t.status === "In Progress").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {tickets.filter((t) => t.status === "Resolved").length}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">
                {ticket.subject} <span className="text-gray-400">·</span> {ticket.user}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-400">{ticket.message}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[ticket.priority]}`}
            >
              {ticket.priority}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[ticket.status]}`}
            >
              {ticket.status}
            </span>
            <button
              onClick={() => advanceStatus(ticket.id)}
              disabled={ticket.status === "Resolved"}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLabel[ticket.status]}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
