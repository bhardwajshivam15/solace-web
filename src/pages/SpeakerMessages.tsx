import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { listeners } from "../data/mockData";
import { useAppData } from "../context/AppDataContext";

export default function SpeakerMessages() {
  const { conversations } = useAppData();

  const threads = listeners
    .map((listener) => {
      const messages = conversations[listener.id] ?? [];
      const lastMessage = messages[messages.length - 1];
      return { listener, messages, lastMessage };
    })
    .filter((thread) => thread.messages.length > 0 && thread.lastMessage);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Messages</h1>

      <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
        {threads.map(({ listener, lastMessage }) => (
          <Link
            key={listener.id}
            to={`/app/find-listeners?listener=${listener.id}`}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50"
          >
            <div className="relative shrink-0">
              <img
                src={listener.avatar}
                alt={listener.name}
                className="h-11 w-11 rounded-full object-cover"
              />
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  listener.online ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-900">{listener.name}</p>
                <p className="shrink-0 text-xs text-gray-400">
                  {lastMessage.time}
                </p>
              </div>
              <p className="truncate text-sm text-gray-500">
                {lastMessage.sender === "speaker" ? "You: " : ""}
                {lastMessage.text}
              </p>
            </div>
          </Link>
        ))}

        {threads.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <MessageCircle className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-ink-900">No messages yet</p>
            <p className="max-w-xs text-sm text-gray-400">
              Start a conversation with a listener and it will show up here.
            </p>
            <Link
              to="/app/find-listeners"
              className="mt-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Find a Listener
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
