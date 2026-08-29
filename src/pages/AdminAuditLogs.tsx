import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface AuditLogEntry {
  admin: string;
  action: string;
  target: string;
  createdAt: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function AdminAuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ data: AuditLogEntry[] }>("/admin/audit-logs", { token })
      .then((response) => setLogs(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load audit logs."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Audit Logs</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        {loading && <p className="py-6 text-center text-sm text-gray-400">Loading...</p>}

        {!loading && logs.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No admin activity yet.</p>
        )}

        {!loading && logs.length > 0 && (
          <div className="space-y-5">
            {logs.map((log, index) => (
              <div key={`${log.createdAt}-${index}`} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                  {index < logs.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-sm font-medium text-ink-900">
                    {log.action} <span className="text-gray-400">·</span> {log.target}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {log.admin} · {formatTimestamp(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
