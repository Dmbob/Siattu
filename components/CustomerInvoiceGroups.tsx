"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import InvoiceGroupFormModal from "@/components/InvoiceGroupFormModal";
import type { InvoiceGroupListItem } from "@/lib/models/InvoiceGroup";

interface Props {
    customerId: string;
    groups: InvoiceGroupListItem[];
}

function usageLabel(g: InvoiceGroupListItem): string {
    const parts: string[] = [];
    if (g.entryCount > 0) parts.push(`${g.entryCount} ${g.entryCount === 1 ? "entry" : "entries"}`);
    if (g.scheduleCount > 0) parts.push(`${g.scheduleCount} ${g.scheduleCount === 1 ? "schedule" : "schedules"}`);
    return parts.length ? parts.join(", ") : "—";
}

export default function CustomerInvoiceGroups({ customerId, groups }: Props) {
    const router = useRouter();
    const [form, setForm] = useState<null | { initial?: InvoiceGroupListItem }>(null);
    const [deleting, setDeleting] = useState<InvoiceGroupListItem | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    function askDelete(g: InvoiceGroupListItem) {
        setDeleteError(null);
        setDeleting(g);
    }

    async function confirmDelete() {
        if (!deleting) return;
        setDeleteBusy(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/invoice-groups/${deleting.id}`, { method: "DELETE" });
            if (res.ok) {
                setDeleting(null);
                router.refresh();
            } else {
                const b = await res.json().catch(() => ({}));
                setDeleteError(b.error?.message ?? "Something went wrong.");
            }
        } finally {
            setDeleteBusy(false);
        }
    }

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setForm({})}>
                    + New Invoice Group
                </button>
            </div>

            {groups.length === 0 ? (
                <p className="text-muted mb-0">No invoice groups yet.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Invoice Description</th>
                                <th>In Use</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((g) => {
                                const inUse = g.entryCount > 0 || g.scheduleCount > 0;
                                return (
                                    <tr key={g.id}>
                                        <td>{g.name}</td>
                                        <td>{g.invoiceDescription}</td>
                                        <td className="text-nowrap">{usageLabel(g)}</td>
                                        <td className="text-end text-nowrap">
                                            <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => setForm({ initial: g })}>Edit</button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => askDelete(g)}
                                                disabled={inUse}
                                                title={inUse ? "In-use groups can't be deleted" : undefined}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <InvoiceGroupFormModal
                    customerId={customerId}
                    initial={form.initial}
                    onClose={() => setForm(null)}
                    onSaved={() => { setForm(null); router.refresh(); }}
                />
            )}

            <Modal
                open={!!deleting}
                onClose={() => setDeleting(null)}
                title="Delete Invoice Group"
                footer={
                    <>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</button>
                        <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteBusy}>
                            {deleteBusy ? "Deleting…" : "Delete"}
                        </button>
                    </>
                }
            >
                {deleteError && <div className="alert alert-danger py-2">{deleteError}</div>}
                <p className="mb-0">Delete this invoice group{deleting ? `: “${deleting.name}”` : ""}? This cannot be undone.</p>
            </Modal>
        </>
    );
}
