"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { formatUSD } from "@/lib/money";
import { entryLineTotal, sumEntryLineTotals, type InvoiceEntryListItem } from "@/lib/models/InvoiceEntry";
import type { InvoiceListRow } from "@/lib/service/InvoiceService";

interface Props {
    customerId: string;
    invoices: InvoiceListRow[];
    entries: InvoiceEntryListItem[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString();

export default function CustomerInvoices({ customerId, invoices, entries }: Props) {
    const router = useRouter();

    // Entries eligible to be invoiced: unbilled and not a running timer.
    const billable = useMemo(
        () => entries.filter((e) => !e.billed && !(e.startTime && !e.endTime)),
        [entries],
    );

    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(todayStr());
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function openModal() {
        setSelected(new Set(billable.map((e) => e.id))); // default: all selected
        setDate(todayStr());
        setError(null);
        setOpen(true);
    }

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    const selectedEntries = billable.filter((e) => selected.has(e.id));
    const total = sumEntryLineTotals(selectedEntries);

    async function create() {
        if (selectedEntries.length === 0) { setError("Select at least one entry."); return; }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerId, date, entryIds: [...selected] }),
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok) {
                router.push(`/invoices/${body.data.id}`);
            } else {
                setError(body.error?.message ?? "Something went wrong.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={openModal} disabled={billable.length === 0}>
                    + New Invoice
                </button>
            </div>

            {invoices.length === 0 ? (
                <p className="text-muted mb-0">No invoices yet for this customer.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th className="text-end">Entries</th>
                                <th className="text-end">Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td>
                                        <Link href={`/invoices/${inv.id}`} className="fw-semibold text-decoration-none">{inv.invoiceNumber}</Link>
                                    </td>
                                    <td className="text-nowrap">{fmtDate(inv.date)}</td>
                                    <td className="text-end">{inv.entryCount}</td>
                                    <td className="text-end">{formatUSD(inv.total)}</td>
                                    <td>
                                        {inv.status === "paid"
                                            ? <span className="badge text-bg-success">Paid</span>
                                            : <span className="badge text-bg-warning">Unpaid</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {billable.length === 0 && invoices.length > 0 && (
                <p className="text-muted small mt-3 mb-0">No unbilled entries available to invoice.</p>
            )}

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="New Invoice"
                footer={
                    <>
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={create} disabled={saving || selectedEntries.length === 0}>
                            {saving ? "Creating…" : `Create Invoice · ${formatUSD(total)}`}
                        </button>
                    </>
                }
            >
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="mb-3" style={{ maxWidth: "16rem" }}>
                    <label htmlFor="inv-date" className="form-label fw-semibold">Invoice Date</label>
                    <input id="inv-date" type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <label className="form-label fw-semibold">Entries to bill</label>
                {billable.length === 0 ? (
                    <p className="text-muted mb-0">No unbilled entries available.</p>
                ) : (
                    <div className="table-responsive border rounded">
                        <table className="table table-sm table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th style={{ width: "2.5rem" }}></th>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th className="text-end">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billable.map((e) => (
                                    <tr key={e.id} role="button" onClick={() => toggle(e.id)}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selected.has(e.id)}
                                                onChange={() => toggle(e.id)}
                                                onClick={(ev) => ev.stopPropagation()}
                                            />
                                        </td>
                                        <td className="text-nowrap">{fmtDate(e.date)}</td>
                                        <td>{e.description}</td>
                                        <td className="text-end">{formatUSD(entryLineTotal(e))}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-top">
                                    <th colSpan={3} className="text-end">Selected total</th>
                                    <th className="text-end">{formatUSD(total)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Modal>
        </>
    );
}
