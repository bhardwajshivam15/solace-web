import { Check, CheckCheck } from "lucide-react";

export default function MessageStatusTicks({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (status === "read") {
    return <CheckCheck className="h-3.5 w-3.5 text-sky-300" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3.5 w-3.5 text-brand-100/80" />;
  }
  return <Check className="h-3.5 w-3.5 text-brand-100/80" />;
}
