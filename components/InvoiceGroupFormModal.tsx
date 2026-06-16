"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import type { InvoiceGroupListItem } from "@/lib/models/InvoiceGroup";

interface Props {
    customerId: string;
    initial?: InvoiceGroupListItem;
    onClose: () => void;
    onSaved: () => void;
}

export default function InvoiceGroupFormModal({ customerId, initial, onClose, onSaved }: Props) {
    const editing = !!initial;
    const [name, setName] = useState(initial?.name ?? "");
    const [invoiceDescription, setInvoiceDescription] = useState(initial?.invoiceDescription ?? "");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const payload = { customerId, name, invoiceDescription };
        try {
            const res = await fetch(editing ? `/api/invoice-groups/${initial!.id}` : "/api/invoice-groups", {
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
        <Modal open onClose={onClose} title={editing ? "Edit Invoice Group" : "New Invoice Group"}>
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="mb-3">
                    <label htmlFor="group-name" className="form-label fw-semibold">Name</label>
                    <input id="group-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                    <div className="form-text">Internal label used to pick this group on entries.</div>
                </div>

                <div className="mb-3">
                    <label htmlFor="group-desc" className="form-label fw-semibold">Invoice Description</label>
                    <input id="group-desc" className="form-control" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)} required />
                    <div className="form-text">Shown as the single line description when this group&apos;s entries appear on an invoice.</div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving…" : editing ? "Save Changes" : "Create Group"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
