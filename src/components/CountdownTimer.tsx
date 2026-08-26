import { useEffect, useState } from "react";

function format(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Counts down to a server-provided deadline — visual only, the backend's own sweep is what actually expires it. */
export default function CountdownTimer({ deadline }: { deadline: string }) {
  const compute = () => (new Date(deadline).getTime() - Date.now()) / 1000;
  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    setRemaining(compute());
    const interval = window.setInterval(() => setRemaining(compute()), 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  return <span className="font-mono">{format(remaining)}</span>;
}
