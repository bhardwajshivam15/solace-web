import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  BadgeCheck,
  Lock,
  Send,
  Smile,
  Heart,
  Star,
  AlertTriangle,
  PhoneCall,
  Loader2,
  Flag,
} from "lucide-react";
import type { Listener, LiveSession } from "../types";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import RatingBadge from "./RatingBadge";
import MessageStatusTicks from "./MessageStatusTicks";
import LiveSessionTimer from "./LiveSessionTimer";
import CountdownTimer from "./CountdownTimer";
import RateSessionModal from "./RateSessionModal";
import ReportConversationModal from "./ReportConversationModal";

const QUICK_EMOJIS = ["😊", "🙂", "❤️", "👍", "😢", "🙏"];

function isSameDay(a: string, b: string): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function formatDateSeparator(iso: string): string {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(iso, now.toISOString())) return "Today";
  if (isSameDay(iso, yesterday.toISOString())) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function SessionControlBar({
  listener,
  session,
  busy,
  error,
  existingRating,
  justCompleted,
  onTalk,
  onJoin,
  onEnd,
  onOpenRating,
}: {
  listener: Listener;
  session: LiveSession | undefined;
  busy: boolean;
  error: string | null;
  existingRating: number | null;
  justCompleted: boolean;
  onTalk: () => void;
  onJoin: () => void;
  onEnd: () => void;
  onOpenRating: () => void;
}) {
  // A COMPLETED session that wasn't just completed in this visit (e.g. the
  // chat was reopened days later) renders exactly like having no session at
  // all — same idle "Talk to Listener" state as any other chat.
  if (
    !session ||
    session.status === "REJECTED" ||
    session.status === "EXPIRED" ||
    (session.status === "COMPLETED" && !justCompleted)
  ) {
    const message =
      session?.status === "REJECTED"
        ? "Your request was declined."
        : session?.status === "EXPIRED"
          ? session.acceptedAt
            ? "You didn't join in time — the request expired."
            : `${listener.name} didn't respond in time.`
          : null;
    return (
      <div className="flex flex-col items-end gap-1">
        {message && <p className="text-xs text-gray-400">{message}</p>}
        <button
          onClick={onTalk}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PhoneCall className="h-4 w-4" />
          Talk to Listener
        </button>
        {error && <p className="max-w-56 text-right text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  if (session.status === "REQUESTED") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
        Waiting for {listener.name} to accept…
      </div>
    );
  }

  if (session.status === "ACCEPTED") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-xs font-medium text-green-600">{listener.name} accepted your request!</p>
        <div className="flex items-center gap-2">
          {session.acceptDeadlineAt && (
            <span className="text-xs text-gray-400">
              Join within <CountdownTimer deadline={session.acceptDeadlineAt} />
            </span>
          )}
          <button
            onClick={onJoin}
            disabled={busy}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Join Conversation
          </button>
        </div>
        {error && <p className="max-w-56 text-right text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  if (session.status === "CONNECTING") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
        Connecting…
      </div>
    );
  }

  if (session.status === "ACTIVE" || session.status === "DISCONNECTED") {
    return (
      <div className="flex items-center gap-4">
        {session.status === "DISCONNECTED" ? (
          <div className="flex items-center gap-1.5 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            Connection lost — waiting to reconnect…
          </div>
        ) : (
          <div className="text-right">
            {session.startedAt && (
              <p className="text-lg font-semibold text-green-600">
                <LiveSessionTimer startedAt={session.startedAt} pausedSeconds={session.pausedSeconds} />
              </p>
            )}
            <p className="text-[11px] text-gray-400">₹{session.pricePerMinute}/min</p>
          </div>
        )}
        <button
          onClick={onEnd}
          disabled={busy}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          End Session
        </button>
      </div>
    );
  }

  if (session.status === "COMPLETED") {
    const minutes = Math.floor((session.durationSeconds ?? 0) / 60);
    const seconds = (session.durationSeconds ?? 0) % 60;
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-sm font-semibold text-ink-900">Session completed</p>
        <p className="text-xs text-gray-400">
          Duration {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} · ₹
          {session.speakerAmount?.toFixed(2)}
        </p>
        {existingRating !== null ? (
          <p className="flex items-center gap-1 text-xs text-green-600">
            <Star className="h-3.5 w-3.5 fill-green-600 text-green-600" />
            You rated this listener {existingRating}/5
          </p>
        ) : (
          <button
            onClick={onOpenRating}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            Rate this listener
          </button>
        )}
        <button
          onClick={onTalk}
          disabled={busy}
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PhoneCall className="h-4 w-4" />
          Talk Again
        </button>
      </div>
    );
  }

  return null;
}

export default function ChatPanel({
  listener,
  onBack,
}: {
  listener: Listener;
  onBack: () => void;
}) {
  const { token } = useAuth();
  const {
    conversations,
    loadConversation,
    setActiveThread,
    sendMessage,
    liveSessions,
    requestSession,
    joinSession,
    endLiveSession,
    loadCurrentSession,
    walletBalance,
    updateListenerRating,
  } = useAppData();
  const [draft, setDraft] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  // Rating is per-SESSION now (every completed session is separately
  // ratable), so this reflects "has THIS session been rated", not "has this
  // listener ever been rated". null = not yet checked / not yet rated.
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [ratingChecked, setRatingChecked] = useState(false);
  const promptedSessionIds = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = conversations[listener.id] ?? [];
  const liveSession = liveSessions[listener.id];

  // "Session completed" should only ever show right after it happens in
  // this visit — loadCurrentSession below fetches the most recent session
  // regardless of age, so without this a chat reopened days later would
  // show a stale completion summary forever instead of looking like any
  // other idle chat. Only a real, *observed* transition into COMPLETED
  // (this end, or the other party ending it via a live WS update) counts —
  // never the initial fetch on mount.
  const [justCompleted, setJustCompleted] = useState(false);
  const prevSessionRef = useRef<{ id?: string; status?: string }>({});

  useEffect(() => {
    const prev = prevSessionRef.current;
    const currentStatus = liveSession?.status;

    if (prev.id !== listener.id) {
      setJustCompleted(false);
    } else if (currentStatus === "COMPLETED" && prev.status && prev.status !== "COMPLETED") {
      setJustCompleted(true);
    } else if (currentStatus !== "COMPLETED") {
      setJustCompleted(false);
    }

    prevSessionRef.current = { id: listener.id, status: currentStatus };
  }, [listener.id, liveSession?.status]);

  useEffect(() => {
    loadConversation(listener.id);
    setActiveThread(listener.id);
    loadCurrentSession(listener.id).catch(() => {});
    return () => setActiveThread(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listener.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Check (and re-check, per session id) whether THIS specific session has
  // already been rated — real server state, not local-only, so it survives
  // reloads and stays consistent with MySessions.tsx's own check.
  useEffect(() => {
    if (liveSession?.status !== "COMPLETED") {
      setExistingRating(null);
      setRatingChecked(false);
      return;
    }
    setRatingChecked(false);
    apiRequest<{ rating: number | null }>(`/speaker/sessions/${liveSession.id}/rating`, { token })
      .then((response) => setExistingRating(response.rating))
      .catch(() => setExistingRating(null))
      .finally(() => setRatingChecked(true));
  }, [liveSession?.id, liveSession?.status, token]);

  // Auto-pop the rating dialog the moment a session completes — but only
  // once we've confirmed (via the check above) that this exact session
  // genuinely hasn't been rated yet, and only once per session id so
  // dismissing it (Skip) doesn't bring it back on every re-render.
  useEffect(() => {
    if (
      liveSession?.status === "COMPLETED" &&
      justCompleted &&
      ratingChecked &&
      existingRating === null &&
      !promptedSessionIds.current.has(liveSession.id)
    ) {
      promptedSessionIds.current.add(liveSession.id);
      setShowRatingModal(true);
    }
  }, [liveSession?.status, liveSession?.id, justCompleted, existingRating, ratingChecked]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(listener.id, draft);
    setDraft("");
    setShowEmojis(false);
  };

  const handleTalk = async () => {
    setSessionError(null);
    setSessionBusy(true);
    try {
      await requestSession(listener.id);
    } catch (err) {
      setSessionError(err instanceof ApiError ? err.message : "Could not send the request.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!liveSession) return;
    setSessionError(null);
    setSessionBusy(true);
    try {
      await joinSession(liveSession.id, listener.id);
    } catch (err) {
      setSessionError(err instanceof ApiError ? err.message : "Could not join the conversation.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleEnd = async () => {
    if (!liveSession) return;
    setSessionBusy(true);
    try {
      await endLiveSession(liveSession.id, listener.id);
    } catch (err) {
      setSessionError(err instanceof ApiError ? err.message : "Could not end the session.");
    } finally {
      setSessionBusy(false);
    }
  };

  // Left to throw on failure (no silent catch) so RateSessionModal can show
  // a real error and let the speaker retry instead of falsely reporting success.
  const handleRate = async (value: number) => {
    if (!liveSession) return;
    const stats = await apiRequest<{ average: number; count: number }>(`/speaker/sessions/${liveSession.id}/rating`, {
      method: "POST",
      token,
      body: { rating: value },
    });
    setExistingRating(value);
    // Reflect the new aggregate immediately — this listener's rating badge
    // updates live in the directory list and this same chat header, no
    // reload needed, since it's the direct result of the speaker's own action.
    updateListenerRating(listener.id, stats.average, stats.count);
  };

  // Left to throw on failure (no silent catch) so ReportConversationModal
  // can show a real error (e.g. no conversation exists yet) and let the
  // speaker retry, rather than falsely reporting success.
  const handleReport = async (reason: string, priority: "LOW" | "MEDIUM" | "HIGH") => {
    await apiRequest(`/speaker/conversations/${listener.id}/report`, {
      method: "POST",
      token,
      body: { reason, priority },
    });
  };

  const isLowBalance = liveSession?.status === "ACTIVE" && !!liveSession.lowBalanceWarnedAt;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Listeners
        </button>
      </div>

      <div className="flex items-center gap-2 bg-blue-50 px-6 py-1.5 text-xs text-blue-700">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        Keep your conversation on Solace. Never exchange phone numbers, emails, social media/WhatsApp
        handles, or payment details.
      </div>

      {isLowBalance && (
        <div className="flex items-center gap-2 bg-amber-50 px-6 py-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Your wallet balance is running low — this session will end automatically if it runs out.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={listener.avatar}
                alt={listener.name}
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate font-semibold text-ink-900">
                    {listener.name}
                  </span>
                  <BadgeCheck className="h-4 w-4 shrink-0 fill-brand-600 text-white" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RatingBadge rating={listener.rating} reviewCount={listener.reviewCount} />
                  <span>·</span>
                  <span className="truncate">{listener.tags.join(" • ")}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setShowReportModal(true)}
                title="Report this conversation"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
              <SessionControlBar
                listener={listener}
                session={liveSession}
                busy={sessionBusy}
                error={sessionError}
                existingRating={existingRating}
                justCompleted={justCompleted}
                onTalk={handleTalk}
                onJoin={handleJoin}
                onEnd={handleEnd}
                onOpenRating={() => setShowRatingModal(true)}
              />
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {messages.map((message, index) => (
              <div key={message.id}>
                {(index === 0 || !isSameDay(message.createdAt, messages[index - 1].createdAt)) && (
                  <div className="mb-5 flex justify-center">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-400">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={`flex ${
                    message.sender === "speaker" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 ${
                      message.sender === "speaker" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {message.sender === "listener" && (
                      <img
                        src={listener.avatar}
                        alt={listener.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    )}
                    <div
                      className={`max-w-sm rounded-2xl px-4 py-3 text-sm ${
                        message.sender === "speaker"
                          ? "rounded-br-sm bg-brand-600 text-white"
                          : "rounded-bl-sm bg-gray-100 text-ink-900"
                      }`}
                    >
                      <p>{message.text}</p>
                      <div
                        className={`mt-1 flex items-center gap-1 text-[10px] ${
                          message.sender === "speaker"
                            ? "justify-end text-brand-100"
                            : "text-gray-400"
                        }`}
                      >
                        {message.time}
                        {message.sender === "speaker" && <MessageStatusTicks status={message.status} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {liveSession?.status === "ACTIVE" ? (
            <form onSubmit={handleSend} className="border-t border-gray-100 px-6 py-4">
              <div className="relative flex items-center gap-3 rounded-full border border-gray-200 px-4 py-2.5">
                {showEmojis && (
                  <div className="absolute bottom-12 left-0 flex gap-1 rounded-xl border border-gray-100 bg-white p-2 shadow-soft">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setDraft((prev) => prev + emoji)}
                        className="rounded-lg p-1 text-lg hover:bg-gray-50"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-gray-400"
                />
                <button type="button" onClick={() => setShowEmojis((prev) => !prev)}>
                  <Smile className="h-5 w-5 text-gray-400 hover:text-brand-600" />
                </button>
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-gray-400">
                <Lock className="h-3 w-3" />
                This conversation is private and anonymous
              </p>
            </form>
          ) : (
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3 rounded-full border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-400">
                <Lock className="h-4 w-4 shrink-0" />
                {liveSession?.status === "DISCONNECTED"
                  ? "Messaging is paused while the connection reconnects."
                  : "Start a session with this listener to send messages."}
              </div>
            </div>
          )}
        </div>

        <aside className="hidden w-72 shrink-0 space-y-4 overflow-y-auto border-l border-gray-100 p-5 lg:block">
          <div className="rounded-2xl border border-gray-100 p-4">
            <p className="mb-3 text-sm font-semibold text-ink-900">
              Session Details
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Price per minute</dt>
                <dd className="font-medium text-ink-900">
                  ₹{listener.pricePerMinute}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="text-xs text-gray-500">Wallet Balance</p>
            <p className="mt-1 text-xl font-bold text-ink-900">
              ₹ {walletBalance.toLocaleString("en-IN")}
            </p>
            <Link
              to="/app/wallet"
              className="mt-3 block w-full rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              Add Money
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 fill-brand-600 text-brand-600" />
              <p className="text-sm font-semibold text-ink-900">Tips</p>
            </div>
            <p className="text-xs text-gray-500">
              Be respectful and kind. This is a safe space for everyone.
            </p>
          </div>
        </aside>
      </div>

      {showRatingModal && liveSession?.status === "COMPLETED" && existingRating === null && (
        <RateSessionModal
          listenerName={listener.name}
          onSubmit={handleRate}
          onClose={() => setShowRatingModal(false)}
        />
      )}

      {showReportModal && (
        <ReportConversationModal
          otherPartyName={listener.name}
          onSubmit={handleReport}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
