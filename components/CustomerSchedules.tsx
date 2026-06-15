"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import ScheduleFormModal from "@/components/ScheduleFormModal";
import { formatUSD } from "@/lib/money";
import { entryLineTotal } from "@/lib/models/InvoiceEntry";
import type { ScheduleListItem } from "@/lib/models/InvoiceEntrySchedule";

interface Props {
    customerId: string;
    schedules: ScheduleListItem[];
}

function formatQty(q: number): string {
    return Number.isInteger(q) ? String(q) : String(Number(q.toFixed(2)));
}

export default function CustomerSchedules({ customerId, schedules }: Props) {
    const router = useRouter();
    const [form, setForm] = useState<null | { initial?: ScheduleListItem }>(null);
    const [deleting, setDeleting] = useState<ScheduleListItem | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    async function confirmDelete() {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            const res = await fetch(`/api/schedules/${deleting.id}`, { method: "DELETE" });
            if (res.ok) {
                setDeleting(null);
                router.refresh();
            }
        } finally {
            setDeleteBusy(false);
        }
    }

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setForm({})}>
                    + New Schedule
                </button>
            </div>

            {schedules.length === 0 ? (
                <p className="text-muted mb-0">No scheduled entries yet.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Type</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Amount</th>
                                <th>Schedule</th>
                                <th>Status</th>
                                <th>Last Run</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.description}</td>
                                    <td>{s.type === "software" ? "Software" : "Billable"}</td>
                                    <td className="text-end">{formatQty(s.quantity)}</td>
                                    <td className="text-end">{formatUSD(entryLineTotal(s))}</td>
                                    <td><code>{s.cron}</code></td>
                                    <td>
                                        {s.active
                                            ? <span className="badge text-bg-success">Active</span>
                                            : <span className="badge text-bg-secondary">Paused</span>}
                                    </td>
                                    <td className="text-nowrap">{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : "—"}</td>
                                    <td className="text-end text-nowrap">
                                        <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => setForm({ initial: s })}>Edit</button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(s)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <ScheduleFormModal
                    customerId={customerId}
                    initial={form.initial}
                    onClose={() => setForm(null)}
                    onSaved={() => { setForm(null); router.refresh(); }}
                />
            )}

            <Modal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                title="Delete Schedule"
                footer={
                    <>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
                        <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>
                            {deleteBusy ? "Deleting…" : "Delete"}
                        </button>
                    </>
                }
            >
                <p className="mb-0">Delete this schedule{deleting ? `: “${deleting.description}”` : ""}? This cannot be undone. Existing entries it created are kept.</p>
            </Modal>
        </>
    );
}
