import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { helpFaqs, supportTickets as seedSupportTickets } from "../data/mockData";
import type { SupportTicket } from "../types";

let ticketId = 100;

const statusStyles: Record<SupportTicket["status"], string> = {
  Open: "bg-amber-50 text-amber-600",
  "In Progress": "bg-brand-50 text-brand-700",
  Resolved: "bg-green-50 text-green-600",
};

const priorityStyles: Record<SupportTicket["priority"], string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

export default function HelpSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>(seedSupportTickets);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) return;
    const ticket: SupportTicket = {
      id: `tk-${ticketId++}`,
      user: "You",
      subject: subject.trim(),
      message: message.trim(),
      status: "Open",
      priority: "Medium",
      createdAt: "Just now",
    };
    setTickets((prev) => [ticket, ...prev]);
    setSubject("");
    setMessage("");
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Help &amp; Support</h1>

      <div className="mt-5">
        <p className="text-sm font-medium text-gray-500">
          Frequently Asked Questions
        </p>
        <div className="mt-3 space-y-3">
          {helpFaqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-gray-100 p-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink-900">
                {faq.question}
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-gray-500">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-gray-500">
          Your Support Tickets
        </p>
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink-900">{ticket.subject}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      priorityStyles[ticket.priority]
                    }`}
                  >
                    {ticket.priority}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[ticket.status]
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">{ticket.message}</p>
              <p className="mt-1 text-xs text-gray-400">{ticket.createdAt}</p>
            </div>
          ))}

          {tickets.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              No support tickets yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 p-6">
        <p className="font-semibold text-ink-900">Raise a new ticket</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Subject
            </label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="What do you need help with?"
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-gray-400 focus:border-brand-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-gray-400 focus:border-brand-300"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
