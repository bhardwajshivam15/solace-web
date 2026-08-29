import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface ErrorLogEntry {
  method: string;
  path: string;
  status: number;
  code: string;
  message: string;
  exceptionClass: string;
  stackTrace: string | null;
  userEmail: string | null;
  createdAt: string;
}

function statusStyle(status: number): string {
  if (status >= 500) return "bg-red-50 text-red-600";
  if (status >= 400) return "bg-amber-50 text-amber-600";
  return "bg-gray-100 text-gray-500";
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function AdminErrorLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    apiRequest<{ data: ErrorLogEntry[] }>("/admin/error-logs", { token })
      .then((response) => setLogs(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load error logs."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Error Logs</h1>
      <p className="mt-1 text-sm text-gray-400">Every exception the API has thrown, most recent first.</p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {loading && <p className="px-5 py-6 text-center text-sm text-gray-400">Loading...</p>}

        {!loading && logs.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-gray-400">No errors logged. All clear.</p>
        )}

        {!loading &&
          logs.map((log, index) => {
            const expanded = expandedIndex === index;
            return (
              <div key={`${log.createdAt}-${index}`} className="px-5 py-4">
                <button
                  onClick={() => setExpandedIndex(expanded ? null : index)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  {expanded ? (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(log.status)}`}>
                        {log.status}
                      </span>
                      <span className="truncate font-mono text-xs text-gray-500">
                        {log.method} {log.path}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-ink-900">
                      {log.code} <span className="text-gray-400">·</span> {log.message}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {log.userEmail ?? "Unauthenticated"} · {formatTimestamp(log.createdAt)}
                    </p>
                  </div>
                </button>

                {expanded && (
                  <div className="ml-7 mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500">{log.exceptionClass}</p>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                      {log.stackTrace ?? "No stack trace captured."}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
