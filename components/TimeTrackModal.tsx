"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import CustomerTypeahead from "@/components/CustomerTypeahead";
import ElapsedTime from "@/components/ElapsedTime";

type Customer = { id: string; name: string; defaultEntryAmount: number };

interface Props {
    open: boolean;
    onClose: () => void;
    openTimer: { customerName: string; startTime: string } | null;
}

export default function TimeTrackModal({ open, onClose, openTimer }: Props) {
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function start(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!customer) { setError("Please select a customer."); return; }
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/time-tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerId: customer.id, description }),
            });
            if (res.ok) { onClose(); router.refresh(); }
            else { const b = await res.json().catch(() => ({})); setError(b.error?.message ?? "Something went wrong."); }
        } finally {
            setBusy(false);
        }
    }

    async function stop() {
        setBusy(true);
        try {
            const res = await fetch("/api/time-tracking/stop", { method: "POST" });
            if (res.ok) { onClose(); router.refresh(); }
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title={openTimer ? "Time Tracking" : "Start Time Tracking"}>
            {openTimer ? (
                <div>
                    <p className="mb-1">
                        Tracking time for <span className="fw-semibold">{openTimer.customerName}</span>.
                    </p>
                    <p className="text-muted">Elapsed: <ElapsedTime startTime={openTimer.startTime} /></p>
                    <div className="d-flex justify-content-end">
                        <button type="button" className="btn btn-danger" onClick={stop} disabled={busy}>
                            {busy ? "Stopping…" : "Stop Timer"}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={start}>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Customer</label>
                        <CustomerTypeahead onSelect={setCustomer} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="tt-desc" className="form-label fw-semibold">Description (optional)</label>
                        <input id="tt-desc" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Time tracking" />
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Starting…" : "Start Timer"}</button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
