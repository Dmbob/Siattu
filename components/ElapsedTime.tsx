"use client";

import { useState, useEffect } from "react";

/** Live HH:MM:SS counter since `startTime`. Renders a placeholder until mounted
 *  to avoid a server/client hydration mismatch. */
export default function ElapsedTime({ startTime }: { startTime: string }) {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    if (now === null) return <span>—</span>;

    const totalSec = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return <span>{pad(h)}:{pad(m)}:{pad(s)}</span>;
}
