import { useState } from "react";
import { reportedConversations as seedReportedConversations } from "../data/mockData";
import type { ReportedConversation } from "../types";

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

const statusStyles: Record<string, string> = {
  Open: "bg-red-50 text-red-500",
  Reviewing: "bg-amber-50 text-amber-600",
  Resolved: "bg-green-50 text-green-600",
};

const withDefaultStatus = (reports: ReportedConversation[]): Required<ReportedConversation>[] =>
  reports.map((report) => ({ ...report, status: report.status ?? "Open" }));

export default function AdminReports() {
  const [reports, setReports] = useState(withDefaultStatus(seedReportedConversations));

  const setReportStatus = (id: string, status: "Reviewing" | "Resolved") => {
    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, status } : report)),
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Reports</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Open</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {reports.filter((r) => r.status === "Open").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Reviewing</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {reports.filter((r) => r.status === "Reviewing").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {reports.filter((r) => r.status === "Resolved").length}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{report.user}</p>
              <p className="text-xs text-gray-400">{report.reason}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[report.priority]}`}
            >
              {report.priority}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[report.status]}`}
            >
              {report.status}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportStatus(report.id, "Resolved")}
                disabled={report.status === "Resolved"}
                className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Resolve
              </button>
              <button
                onClick={() => setReportStatus(report.id, "Reviewing")}
                disabled={report.status === "Reviewing"}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
