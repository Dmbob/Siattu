"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";
import InvoiceEntryFormModal, { EntryFormValues } from "@/components/InvoiceEntryFormModal";
import { formatUSD } from "@/lib/money";
import { entryLineTotal, type InvoiceEntryListItem } from "@/lib/models/InvoiceEntry";

interface Props {
    entries: InvoiceEntryListItem[];
    fixedCustomer?: { id: string; name: string; defaultEntryAmount: number };
}

function formatQty(q: number): string {
    return Number.isInteger(q) ? String(q) : String(Number(q.toFixed(2)));
}

export default function InvoiceEntryTable({ entries, fixedCustomer }: Props) {
    const router = useRouter();
    const [form, setForm] = useState<null | { initial?: EntryFormValues }>(null);
    const [deleting, setDeleting] = useState<InvoiceEntryListItem | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const showCustomer = !fixedCustomer;

    function openEdit(e: InvoiceEntryListItem) {
        setForm({
            initial: {
                id: e.id,
                customerId: e.customer.id,
                customerName: e.customer.name,
                customerDefaultRate: e.customer.defaultEntryAmount,
                description: e.description,
                type: e.type,
                date: new Date(e.date).toISOString(),
                quantity: e.quantity,
                amount: e.amount,
                startTime: e.startTime ? new Date(e.startTime).toISOString() : null,
                endTime: e.endTime ? new Date(e.endTime).toISOString() : null,
            },
        });
    }

    async function confirmDelete() {
        if (!deleting) return;
        setDeleteBusy(true);
        try {
            const res = await fetch(`/api/invoice-entries/${deleting.id}`, { method: "DELETE" });
            if (res.ok) {
                setDeleting(null);
                router.refresh();
            }
        } finally {
            setDeleteBusy(false);
        }
    }

    function statusBadge(e: InvoiceEntryListItem) {
        if (e.startTime && !e.endTime) return <span className="badge text-bg-info">Running</span>;
        if (e.billed) return <span className="badge text-bg-secondary">Billed</span>;
        return <span className="badge text-bg-warning">Unbilled</span>;
    }

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setForm({})}>
                    + New Invoice Entry
                </button>
            </div>

            {entries.length === 0 ? (
                <p className="text-muted mb-0">No invoice entries yet.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Date</th>
                                {showCustomer && <th>Customer</th>}
                                <th>Description</th>
                                <th>Type</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Amount</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((e) => (
                                <tr key={e.id}>
                                    <td className="text-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                                    {showCustomer && (
                                        <td>
                                            <Link href={`/customers/${e.customer.id}`} className="text-decoration-none">
                                                {e.customer.name}
                                            </Link>
                                        </td>
                                    )}
                                    <td>{e.description}</td>
                                    <td>{e.type === "software" ? "Software" : "Billable"}</td>
                                    <td className="text-end">{formatQty(e.quantity)}</td>
                                    <td className="text-end">{formatUSD(entryLineTotal(e))}</td>
                                    <td>{statusBadge(e)}</td>
                                    <td className="text-end text-nowrap">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary me-1"
                                            onClick={() => openEdit(e)}
                                            disabled={e.billed}
                                            title={e.billed ? "Billed entries can't be edited" : undefined}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => setDeleting(e)}
                                            disabled={e.billed}
                                            title={e.billed ? "Billed entries can't be deleted" : undefined}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <InvoiceEntryFormModal
                    initial={form.initial}
                    fixedCustomer={fixedCustomer}
                    onClose={() => setForm(null)}
                    onSaved={() => { setForm(null); router.refresh(); }}
                />
            )}

            <Modal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                title="Delete Invoice Entry"
                footer={
                    <>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
                        <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>
                            {deleteBusy ? "Deleting…" : "Delete"}
                        </button>
                    </>
                }
            >
                <p className="mb-0">Delete this invoice entry{deleting ? `: “${deleting.description}”` : ""}? This cannot be undone.</p>
            </Modal>
        </>
    );
}
