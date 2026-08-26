import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, BadgeCheck, Lock, Send, Smile, Heart } from "lucide-react";
import type { Listener } from "../types";
import { useAppData } from "../context/AppDataContext";
import RatingBadge from "./RatingBadge";
import MessageStatusTicks from "./MessageStatusTicks";

const QUICK_EMOJIS = ["😊", "🙂", "❤️", "👍", "😢", "🙏"];

export default function ChatPanel({
  listener,
  onBack,
}: {
  listener: Listener;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { conversations, loadConversation, setActiveThread, sendMessage, endSession, walletBalance } = useAppData();
  const [draft, setDraft] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = conversations[listener.id] ?? [];

  useEffect(() => {
    loadConversation(listener.id);
    setActiveThread(listener.id);
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

  const handleEndSession = () => {
    endSession(listener);
    navigate("/app/sessions");
  };

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

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <img
                src={listener.avatar}
                alt={listener.name}
                className="h-11 w-11 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-ink-900">
                    {listener.name}
                  </span>
                  <BadgeCheck className="h-4 w-4 fill-brand-600 text-white" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RatingBadge rating={listener.rating} reviewCount={listener.reviewCount} />
                  <span>·</span>
                  <span>{listener.tags.join(" • ")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-mono text-lg font-semibold text-green-600">
                  00:12:45
                </p>
                <p className="text-[11px] text-gray-400">Session Time</p>
              </div>
              <button
                onClick={handleEndSession}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
              >
                End Session
              </button>
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
              <div className="flex justify-between">
                <dt className="text-gray-500">Listener Earning</dt>
                <dd className="font-medium text-ink-900">
                  ₹{listener.listenerEarningPerMinute ?? listener.pricePerMinute}/min
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Platform Fee</dt>
                <dd className="font-medium text-ink-900">₹{listener.platformFeePerMinute ?? 0}/min</dd>
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
