import { useEffect, useState } from "react";
import { Headphones, Lock, HeartHandshake, ShieldAlert, Ban } from "lucide-react";
import { apiRequest } from "../lib/apiClient";

interface GuidelinesStatus {
  needsAcknowledgement: boolean;
}

// Global, blocking "Before You Start" welcome screen shown once per listener
// per guidelines version — mirrors IncomingSessionRequestModal's pattern of
// a status-driven overlay mounted in ListenerLayout, independent of whatever
// page is showing underneath. Purely an onboarding nudge: going online was
// never gated on anything beyond being an approved, active listener, and
// this doesn't change that.
export default function ListenerGuidelinesGate() {
  const [needsAcknowledgement, setNeedsAcknowledgement] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    apiRequest<GuidelinesStatus>("/listener/guidelines/status")
      .then((status) => setNeedsAcknowledgement(status.needsAcknowledgement))
      .catch(() => {});
  }, []);

  if (!needsAcknowledgement) return null;

  const handleContinue = async () => {
    setAcknowledging(true);
    try {
      await apiRequest("/listener/guidelines/acknowledge", { method: "POST" });
      setNeedsAcknowledgement(false);
    } catch {
      setAcknowledging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <Headphones className="h-7 w-7 text-brand-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink-900">Welcome to Solace</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your Listener application has been approved. Before you go online, please remember:
        </p>

        <ul className="mt-5 space-y-2.5 text-left text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            Keep conversations inside Solace.
          </li>
          <li className="flex items-start gap-2">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            Don't exchange phone numbers or email addresses.
          </li>
          <li className="flex items-start gap-2">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            Don't move conversations to WhatsApp, Telegram, social media, or other platforms.
          </li>
          <li className="flex items-start gap-2">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            Don't accept direct/off-platform payments.
          </li>
          <li className="flex items-start gap-2">
            <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            Treat every Speaker with respect.
          </li>
          <li className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            Protect Speaker privacy and confidentiality.
          </li>
          <li className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            Do not represent yourself as a professional unless you are appropriately qualified.
          </li>
        </ul>

        <button
          type="button"
          onClick={handleContinue}
          disabled={acknowledging}
          className="mt-6 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {acknowledging ? "Continuing…" : "I Understand & Continue"}
        </button>
      </div>
    </div>
  );
}
