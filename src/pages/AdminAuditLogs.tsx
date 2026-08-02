import { auditLogs } from "../data/mockData";

export default function AdminAuditLogs() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Audit Logs</h1>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <div className="space-y-5">
          {auditLogs.map((log, index) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                {index < auditLogs.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-gray-100" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <p className="text-sm font-medium text-ink-900">
                  {log.action} <span className="text-gray-400">·</span> {log.target}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {log.admin} · {log.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
