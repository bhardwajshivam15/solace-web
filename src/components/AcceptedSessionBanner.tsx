import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneCall } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { resolveAssetUrl, ApiError } from "../lib/apiClient";
import CountdownTimer from "./CountdownTimer";

/**
 * Global banner — a speaker might be anywhere in the app (not necessarily on
 * the chat screen) when a listener accepts their request, so this can't live
 * inside ChatPanel alone.
 */
export default function AcceptedSessionBanner() {
  const navigate = useNavigate();
  const { liveSessions, joinSession } = useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = Object.values(liveSessions).find(
    (session) => session.status === "ACCEPTED" && !session.speakerConnected,
  );
  if (!pending) return null;

  const handleJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      await joinSession(pending.id, pending.listenerId);
      navigate(`/app/find-listeners?listener=${pending.listenerId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not join the conversation.");
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-brand-600 px-6 py-3 text-white">
      <div className="flex items-center gap-3">
        <img
          src={resolveAssetUrl(pending.listenerAvatar) ?? undefined}
          alt={pending.listenerName}
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white/40"
        />
        <div>
          <p className="text-sm font-semibold">{pending.listenerName} accepted your request!</p>
          {pending.acceptDeadlineAt && (
            <p className="text-xs text-brand-100">
              Join within <CountdownTimer deadline={pending.acceptDeadlineAt} />
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && <p className="text-xs text-red-100">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PhoneCall className="h-4 w-4" />
          Join Conversation
        </button>
      </div>
    </div>
  );
}
