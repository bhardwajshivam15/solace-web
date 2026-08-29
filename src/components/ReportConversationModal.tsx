import { useState } from "react";
import { Flag } from "lucide-react";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export default function ReportConversationModal({
  otherPartyName,
  onSubmit,
  onClose,
}: {
  otherPartyName: string;
  onSubmit: (reason: string, priority: Priority) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason.trim(), priority);
      setSubmitted(true);
      window.setTimeout(onClose, 1500);
    } catch {
      setError("Could not submit your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {submitted ? (
          <div className="text-center">
            <h2 className="text-lg font-bold text-ink-900">Report submitted</h2>
            <p className="mt-1 text-sm text-gray-500">
              Our team will review this conversation with {otherPartyName}.
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <Flag className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="mt-4 text-center text-lg font-bold text-ink-900">Report this conversation</h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              Tell us what happened with {otherPartyName}. Messages are end-to-end encrypted, so only what
              you describe here is shared with our team.
            </p>

            <label className="mt-5 block text-xs font-medium text-gray-500">What happened?</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Describe the issue…"
              disabled={submitting}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />

            <label className="mt-4 block text-xs font-medium text-gray-500">Severity</label>
            <div className="mt-1.5 flex gap-2">
              {(["LOW", "MEDIUM", "HIGH"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPriority(option)}
                  disabled={submitting}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                    priority === option
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {option === "LOW" ? "Low" : option === "MEDIUM" ? "Medium" : "High"}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason.trim()}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
