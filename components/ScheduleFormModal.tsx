"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import CronField from "@/components/CronField";
import { centsToDollars, dollarsToCents, formatUSD } from "@/lib/money";
import type { ScheduleListItem } from "@/lib/models/InvoiceEntrySchedule";

interface Props {
    customerId: string;
    initial?: ScheduleListItem;
    onClose: () => void;
    onSaved: () => void;
}

export default function ScheduleFormModal({ customerId, initial, onClose, onSaved }: Props) {
    const editing = !!initial;
    const [description, setDescription] = useState(initial?.description ?? "");
    const [type, setType] = useState(initial?.type ?? "bill");
    const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
    const [amount, setAmount] = useState(initial ? centsToDollars(initial.amount).toFixed(2) : "0.00");
    const [cron, setCron] = useState(initial?.cron ?? "0 9 1 * *");
    const [active, setActive] = useState(initial?.active ?? true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const lineTotal = Math.round(dollarsToCents(amount) * (Number(quantity) || 0));

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const payload = {
            customerId,
            description,
            type,
            quantity: Number(quantity),
            amount: dollarsToCents(amount),
            cron: cron.trim(),
            active,
        };
        try {
            const res = await fetch(editing ? `/api/schedules/${initial!.id}` : "/api/schedules", {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) onSaved();
            else { const b = await res.json().catch(() => ({})); setError(b.error?.message ?? "Something went wrong."); }
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal open onClose={onClose} title={editing ? "Edit Schedule" : "New Schedule"}>
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="mb-3">
                    <label htmlFor="sched-description" className="form-label fw-semibold">Description</label>
                    <input id="sched-description" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-4">
                        <label htmlFor="sched-type" className="form-label fw-semibold">Type</label>
                        <select id="sched-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="bill">Billable</option>
                            <option value="software">Software</option>
                        </select>
                    </div>
                    <div className="col-6 col-sm-4">
                        <label htmlFor="sched-qty" className="form-label fw-semibold">Quantity</label>
                        <input id="sched-qty" className="form-control" type="number" min={0} step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                    </div>
                    <div className="col-6 col-sm-4">
                        <label htmlFor="sched-amount" className="form-label fw-semibold">Amount (each)</label>
                        <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input id="sched-amount" className="form-control" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                        </div>
                    </div>
                </div>

                <div className="mb-3">
                    <label htmlFor="sched-cron" className="form-label fw-semibold">Schedule (cron)</label>
                    <CronField id="sched-cron" value={cron} onChange={setCron} />
                </div>

                <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" id="sched-active" checked={active} onChange={(e) => setActive(e.target.checked)} />
                    <label className="form-check-label fw-semibold" htmlFor="sched-active">Active</label>
                </div>

                <div className="small text-muted mb-1">
                    Each run creates an entry of <span className="fw-semibold text-body">{formatUSD(lineTotal)}</span>.
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving…" : editing ? "Save Changes" : "Create Schedule"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
