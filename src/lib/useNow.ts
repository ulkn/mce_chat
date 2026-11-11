import { useEffect, useState } from 'react';

// "yazıyor…" ve "çevrimiçi" gibi zamana bağlı yazıların tazelenmesi için ekranı aralıklarla yeniler.
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
