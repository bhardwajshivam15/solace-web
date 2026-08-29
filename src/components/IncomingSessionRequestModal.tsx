import { useState } from "react";
import { Check, X, Clock, PhoneCall } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { ApiError } from "../lib/apiClient";

/** Global overlay — the listener needs to see this regardless of which page they're on. */
export default function IncomingSessionRequestModal() {
  const { incomingSessionRequest, heldSessionRequests, acceptSessionRequest, rejectSessionRequest, holdSessionRequest } =
    useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!incomingSessionRequest || incomingSessionRequest.status !== "REQUESTED") return null;
  const request = incomingSessionRequest;

  // This component is mounted once globally and never unmounts between
  // requests — busy must be reset on success too, or it stays stuck
  // disabled for every subsequent incoming request after the first accept.
  const handleAccept = async () => {
    setBusy(true);
    setError(null);
    try {
      await acceptSessionRequest(request.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept the request.");
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    setError(null);
    try {
      await rejectSessionRequest(request.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not decline the request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <PhoneCall className="h-7 w-7 text-brand-600" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink-900">New Conversation Request</h2>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-semibold text-ink-900">{request.speakerLabel}</span> wants to talk to you.
        </p>
        {heldSessionRequests.length > 0 && (
          <p className="mt-1 text-xs text-brand-600">
            +{heldSessionRequests.length} more request{heldSessionRequests.length > 1 ? "s" : ""} waiting
          </p>
        )}

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDecline}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
        </div>

        <button
          onClick={() => holdSessionRequest(request.id)}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Clock className="h-3.5 w-3.5" />
          Hold for later
        </button>
      </div>
    </div>
  );
}
