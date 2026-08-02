import { Link } from "react-router-dom";
import { listenerConversations } from "../data/mockData";

export default function ListenerMessages() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Messages</h1>

      <div className="mt-5 space-y-3">
        {listenerConversations.map((conversation) => (
          <div
            key={conversation.id}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink-900">
                  {conversation.speakerLabel}
                </p>
                {conversation.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                    {conversation.unread}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{conversation.topic}</p>
              <p className="mt-1 truncate text-sm text-gray-600">
                {conversation.lastMessage}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-gray-400">
                {conversation.lastMessageAt}
              </span>
              <Link
                to="/listener"
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Reply
              </Link>
            </div>
          </div>
        ))}

        {listenerConversations.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No conversations yet.
          </p>
        )}
      </div>
    </div>
  );
}
