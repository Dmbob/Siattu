"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { centsToDollars, dollarsToCents } from "@/lib/money";

interface Props {
    customerId: string;
    startingInvoiceNumber: number;
    defaultEntryAmount: number;
}

export default function CustomerSettingsForm({ customerId, startingInvoiceNumber, defaultEntryAmount }: Props) {
    const router = useRouter();
    const [startNum, setStartNum] = useState(String(startingInvoiceNumber));
    const [rate, setRate] = useState(centsToDollars(defaultEntryAmount).toFixed(2));
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "danger"; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/customers/${customerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startingInvoiceNumber: Number(startNum),
                    defaultEntryAmount: dollarsToCents(rate),
                }),
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Settings saved." });
                router.refresh();
            } else {
                const body = await res.json().catch(() => ({}));
                setMessage({ type: "danger", text: body.error?.message ?? "Something went wrong." });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
            {message && <div className={`alert alert-${message.type} py-2`}>{message.text}</div>}

            <div className="mb-3">
                <label htmlFor="startingInvoiceNumber" className="form-label fw-semibold">Starting Invoice Number</label>
                <input
                    id="startingInvoiceNumber"
                    className="form-control"
                    type="number"
                    min={1}
                    step={1}
                    value={startNum}
                    onChange={(e) => setStartNum(e.target.value)}
                    required
                />
                <div className="form-text">The first invoice number used for this customer.</div>
            </div>

            <div className="mb-3">
                <label htmlFor="defaultEntryAmount" className="form-label fw-semibold">Default Hourly Rate</label>
                <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                        id="defaultEntryAmount"
                        className="form-control"
                        type="number"
                        min={0}
                        step="0.01"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        required
                    />
                    <span className="input-group-text">/ hr</span>
                </div>
                <div className="form-text">Used to bill time-tracking entries (rate × hours).</div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Settings"}
            </button>
        </form>
    );
}
