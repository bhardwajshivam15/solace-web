const HEIGHT = 160;

export default function SessionsBarChart({
  data,
}: {
  data: { day: string; value: number }[];
}) {
  const max = Math.max(...data.map((point) => point.value));

  return (
    <div className="flex h-40 items-end gap-3">
      {data.map((point) => (
        <div key={point.day} className="flex flex-1 flex-col items-center gap-2">
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
