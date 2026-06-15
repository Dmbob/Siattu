"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ElapsedTime from "@/components/ElapsedTime";

interface Props {
    customerName: string;
    startTime: string;
}

export default function InProgressBanner({ customerName, startTime }: Props) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function stop() {
        setBusy(true);
        try {
            const res = await fetch("/api/time-tracking/stop", { method: "POST" });
            if (res.ok) router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="alert alert-primary d-flex flex-wrap align-items-center gap-2 shadow-sm" role="alert">
            <span className="fs-4 me-1" aria-hidden>⏱</span>
            <div className="me-auto">
                <span className="fw-semibold">Time tracking in progress</span> for{" "}
                <span className="fw-semibold">{customerName}</span>
                <span className="text-muted"> · <ElapsedTime startTime={startTime} /></span>
            </div>
            <button type="button" className="btn btn-sm btn-danger" onClick={stop} disabled={busy}>
                {busy ? "Stopping…" : "Stop"}
            </button>
        </div>
    );
}
