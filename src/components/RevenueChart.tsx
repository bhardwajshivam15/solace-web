const WIDTH = 640;
const HEIGHT = 180;
const PADDING = 20;

export default function RevenueChart({
  data,
}: {
  data: { day: string; value: number }[];
}) {
  const max = Math.max(...data.map((point) => point.value));
  const min = Math.min(...data.map((point) => point.value));
  const range = max - min || 1;

  const step = (WIDTH - PADDING * 2) / (data.length - 1);

  const points = data.map((point, index) => {
    const x = PADDING + index * step;
    const y =
      PADDING +
      (HEIGHT - PADDING * 2) * (1 - (point.value - min) / range);
    return { x, y, ...point };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    HEIGHT - PADDING
  } L ${points[0].x} ${HEIGHT - PADDING} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-44 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#revenueFill)" />
      <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth={2.5} />

      {points.map((p) => (
        <circle key={p.day} cx={p.x} cy={p.y} r={3.5} fill="#7c3aed" />
      ))}
    </svg>
  );
}
