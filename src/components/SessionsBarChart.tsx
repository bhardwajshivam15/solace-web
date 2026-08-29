const HEIGHT = 140;

export default function SessionsBarChart({
  data,
}: {
  data: { day: string; value: number }[];
}) {
  // Math.max(..., 1) avoids a 0/0 = NaN bar height on days with zero
  // sessions across the whole range (a real possibility on a quiet day in
  // a low-traffic dev/test environment).
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="flex h-48 items-end gap-3">
      {data.map((point) => (
        <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-semibold text-ink-900">{point.value}</span>
          <div
            className="w-full rounded-t-lg bg-brand-200 transition-all hover:bg-brand-400"
            style={{ height: `${(point.value / max) * HEIGHT}px` }}
          />
          <span className="text-[11px] text-gray-400">{point.day}</span>
        </div>
      ))}
    </div>
  );
}
