import { useEffect, useState } from "react";

function format(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * A ticking mm:ss display — purely visual. Every tick recomputes elapsed
 * time from the server-provided `startedAt` (and `pausedSeconds`, so a prior
 * disconnect/reconnect within this same session doesn't inflate it), never
 * increments a local counter — so it can never drift from what the backend
 * will actually bill.
 */
export default function LiveSessionTimer({
  startedAt,
  pausedSeconds,
}: {
  startedAt: string;
  pausedSeconds: number;
}) {
  const compute = () => (Date.now() - new Date(startedAt).getTime()) / 1000 - pausedSeconds;
  const [elapsed, setElapsed] = useState(compute);

  useEffect(() => {
    setElapsed(compute());
    const interval = window.setInterval(() => setElapsed(compute()), 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, pausedSeconds]);

  return <span className="font-mono">{format(elapsed)}</span>;
}
