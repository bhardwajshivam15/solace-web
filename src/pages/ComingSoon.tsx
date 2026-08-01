import { Sparkles } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <Sparkles className="h-7 w-7 text-brand-600" />
      </div>
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      <p className="max-w-sm text-sm text-gray-500">
        This screen isn't part of the current mockup yet — coming in a future
        milestone.
      </p>
    </div>
  );
}
