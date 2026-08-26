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
} from "lucide-react";
import type { Listener, LiveSession } from "../types";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import RatingBadge from "./RatingBadge";
import MessageStatusTicks from "./MessageStatusTicks";
import LiveSessionTimer from "./LiveSessionTimer";
import CountdownTimer from "./CountdownTimer";

const QUICK_EMOJIS = ["😊", "🙂", "❤️", "👍", "😢", "🙏"];

function SessionControlBar({
  listener,
  session,
  busy,
  error,
  onTalk,
  onJoin,
  onEnd,
  onRate,
}: {
  listener: Listener;
  session: LiveSession | undefined;
  busy: boolean;
  error: string | null;
  onTalk: () => void;
  onJoin: () => void;
  onEnd: () => void;
  onRate: (value: number) => void;
}) {
  const [rated, setRated] = useState(false);

  if (!session || session.status === "REJECTED" || session.status === "EXPIRED") {
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
        {!rated ? (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => {
                  onRate(value);
                  setRated(true);
                }}
              >
                <Star className="h-4 w-4 text-gray-300 hover:fill-amber-400 hover:text-amber-400" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-green-600">Thanks for rating!</p>
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
  } = useAppData();
  const [draft, setDraft] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = conversations[listener.id] ?? [];
  const liveSession = liveSessions[listener.id];

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

  const handleRate = (value: number) => {
    apiRequest(`/speaker/listeners/${listener.id}/rating`, {
      method: "POST",
      token,
      body: { rating: value },
    }).catch(() => {});
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

      {isLowBalance && (
        <div className="flex items-center gap-2 bg-amber-50 px-6 py-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Your wallet balance is running low — this session will end automatically if it runs out.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
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

            <div className="shrink-0">
              <SessionControlBar
                listener={listener}
                session={liveSession}
                busy={sessionBusy}
                error={sessionError}
                onTalk={handleTalk}
                onJoin={handleJoin}
                onEnd={handleEnd}
                onRate={handleRate}
              />
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div className="flex justify-center">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-400">
                Today
              </span>
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
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
    </div>
  );
}
