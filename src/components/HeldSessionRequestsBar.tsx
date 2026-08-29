import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X, Clock } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { ApiError } from "../lib/apiClient";
import type { LiveSession } from "../types";
import CountdownTimer from "./CountdownTimer";

function HeldRequestRow({ request }: { request: LiveSession }) {
  const { acceptSessionRequest, rejectSessionRequest } = useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setBusy(true);
    setError(null);
    try {
      await acceptSessionRequest(request.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept the request.");
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
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-2.5">
      <div>
        <p className="text-sm font-semibold">{request.speakerLabel}</p>
        {request.acceptDeadlineAt && (
          <p className="text-xs text-brand-100">
            Expires in <CountdownTimer deadline={request.acceptDeadlineAt} />
          </p>
        )}
        {error && <p className="text-xs text-red-100">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecline}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg border border-white/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Decline
        </button>
        <button
          onClick={handleAccept}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" />
          Accept
        </button>
      </div>
    </div>
  );
}

/**
 * Global waiting-list for requests the listener chose "Hold for later" on —
 * they're still real REQUESTED sessions (nothing rejected, nothing expired
 * early), just tucked out of the blocking modal until acted on here.
 */
export default function HeldSessionRequestsBar() {
  const { heldSessionRequests } = useAppData();
  const [expanded, setExpanded] = useState(false);

  if (heldSessionRequests.length === 0) return null;

  return (
    <div className="bg-brand-600 px-6 py-3 text-white">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4" />
          {heldSessionRequests.length} request{heldSessionRequests.length > 1 ? "s" : ""} on hold
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {heldSessionRequests.map((request) => (
            <HeldRequestRow key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
