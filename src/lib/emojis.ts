// Shared by the composer's quick-emoji picker (appends into the outgoing
// text draft) and the new per-message reaction picker (attaches to a
// specific message) — one bigger, common-expression set instead of two
// separate small ones so both feel equally expressive.
export const QUICK_EMOJIS = [
  "😊", "🙂", "😂", "❤️", "👍", "👎", "😢", "😮",
  "😡", "🙏", "🎉", "🔥", "💯", "😍", "🤔", "😴",
];

// A shorter set specifically for the reaction popover — a full 16-emoji grid
// next to every message bubble would be visually heavy; this is the common
// WhatsApp/iMessage-style "quick react" row, pulled from the same palette.
export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];
