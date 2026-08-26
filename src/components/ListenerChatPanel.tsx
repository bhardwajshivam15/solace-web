import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, Lock, Send, Smile, UserRound } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import MessageStatusTicks from "./MessageStatusTicks";

const QUICK_EMOJIS = ["😊", "🙂", "❤️", "👍", "😢", "🙏"];

export default function ListenerChatPanel({
  speakerId,
  speakerLabel,
  onBack,
}: {
  speakerId: string;
  speakerLabel: string;
  onBack: () => void;
}) {
  const { conversations, loadConversation, setActiveThread, sendMessage } = useAppData();
  const [draft, setDraft] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = conversations[speakerId] ?? [];

  useEffect(() => {
    loadConversation(speakerId);
    setActiveThread(speakerId);
    return () => setActiveThread(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(speakerId, draft);
    setDraft("");
    setShowEmojis(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Messages
        </button>
      </div>

      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-ink-900">{speakerLabel}</p>
          <p className="text-xs text-gray-400">Anonymous — this person's identity is never shared</p>
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
            className={`flex ${message.sender === "listener" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex items-end gap-2 ${message.sender === "listener" ? "flex-row-reverse" : ""}`}
            >
              {message.sender === "speaker" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <UserRound className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`max-w-sm rounded-2xl px-4 py-3 text-sm ${
                  message.sender === "listener"
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm bg-gray-100 text-ink-900"
                }`}
              >
                <p>{message.text}</p>
                <div
                  className={`mt-1 flex items-center gap-1 text-[10px] ${
                    message.sender === "listener" ? "justify-end text-brand-100" : "text-gray-400"
                  }`}
                >
                  {message.time}
                  {message.sender === "listener" && <MessageStatusTicks status={message.status} />}
                </div>
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No messages yet — say hello when you're ready.
          </p>
        )}
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
  );
}
