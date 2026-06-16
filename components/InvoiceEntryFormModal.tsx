"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import CustomerTypeahead from "@/components/CustomerTypeahead";
import InvoiceGroupTypeahead from "@/components/InvoiceGroupTypeahead";
import CronField from "@/components/CronField";
import { centsToDollars, dollarsToCents, formatUSD } from "@/lib/money";
import { halfHourOptions, hoursBetween, billableHalfHours, formatHours } from "@/lib/time";

type Customer = { id: string; name: string; defaultEntryAmount: number };

export interface EntryFormValues {
    id: string;
    customerId: string;
    customerName: string;
    customerDefaultRate: number;
    description: string;
    type: string;
    date: string;
    quantity: number;
    amount: number; // hourly rate when timed, else the line total
    startTime: string | null;
    endTime: string | null;
    invoiceGroupId: string | null;
    invoiceGroupName: string | null;
}

interface Props {
    onClose: () => void;
    onSaved: () => void;
    fixedCustomer?: Customer;
    initial?: EntryFormValues;
}

const OPTIONS = halfHourOptions();
const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

function localDateStr(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function halfHourStr(iso: string): string {
    const d = new Date(iso);
    let mins = Math.round((d.getHours() * 60 + d.getMinutes()) / 30) * 30;
    if (mins >= 1440) mins = 1410;
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

export default function InvoiceEntryFormModal({ onClose, onSaved, fixedCustomer, initial }: Props) {
    const editing = !!initial;
    const initialCustomer =
        fixedCustomer ??
        (initial ? { id: initial.customerId, name: initial.customerName, defaultEntryAmount: initial.customerDefaultRate } : null);

    const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
    const [description, setDescription] = useState(initial?.description ?? "");
    const [type, setType] = useState(initial?.type ?? "bill");
    const [date, setDate] = useState(initial?.date ? localDateStr(initial.date) : todayStr());
    const [trackTime, setTrackTime] = useState(!!initial?.startTime);
    const [startT, setStartT] = useState(initial?.startTime ? halfHourStr(initial.startTime) : "");
    const [endT, setEndT] = useState(initial?.endTime ? halfHourStr(initial.endTime) : "");
    const [quantity, setQuantity] = useState(String(initial && !initial.startTime ? initial.quantity : 1));
    const [amount, setAmount] = useState(initial ? centsToDollars(initial.amount).toFixed(2) : "0.00");
    const [groupId, setGroupId] = useState<string | null>(initial?.invoiceGroupId ?? null);
    const [groupName, setGroupName] = useState<string | null>(initial?.invoiceGroupName ?? null);
    const [recurring, setRecurring] = useState(false);
    const [cron, setCron] = useState("0 9 1 * *");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    // Once the entry is created, a retry (e.g. after a schedule failure) must not
    // create it again — only re-attempt the schedule.
    const [entryDone, setEntryDone] = useState(false);

    // Recurrence is only offered for brand-new, non-timed entries (you can't
    // schedule a running timer).
    const canRecur = !editing && !trackTime;

    function pickCustomer(c: Customer) {
        setCustomer(c);
        // Groups are customer-scoped — a new customer invalidates the prior choice.
        setGroupId(null);
        setGroupName(null);
        if (trackTime) setAmount(centsToDollars(c.defaultEntryAmount).toFixed(2));
    }
    function toggleTrack(checked: boolean) {
        setTrackTime(checked);
        if (checked) setAmount(centsToDollars((customer ?? fixedCustomer)?.defaultEntryAmount ?? 0).toFixed(2));
        else setAmount("0.00");
    }

    const rateCents = dollarsToCents(amount);
    const startDate = trackTime && date && startT ? new Date(`${date}T${startT}:00`) : null;
    const endDate = trackTime && date && endT ? new Date(`${date}T${endT}:00`) : null;
    const completed = !!(startDate && endDate);
    const validRange = !completed || endDate! > startDate!;
    const timedHours = completed && validRange ? billableHalfHours(hoursBetween(startDate!, endDate!)) : 0;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!customer) { setError("Please select a customer."); return; }
        if (trackTime && !startT) { setError("Please select a start time."); return; }
        if (completed && !validRange) { setError("End time must be after start time."); return; }
        setSaving(true);
        setError(null);
        const payload = trackTime
            ? {
                customerId: customer.id, description, type, date, trackTime: true,
                amount: rateCents,
                startTime: startDate!.toISOString(),
                endTime: endDate ? endDate.toISOString() : null,
                invoiceGroupId: groupId,
            }
            : {
                customerId: customer.id, description, type, date, trackTime: false,
                quantity: Number(quantity), amount: dollarsToCents(amount),
                invoiceGroupId: groupId,
            };
        try {
            if (!entryDone) {
                const res = await fetch(editing ? `/api/invoice-entries/${initial!.id}` : "/api/invoice-entries", {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const b = await res.json().catch(() => ({}));
                    setError(b.error?.message ?? "Something went wrong.");
                    return;
                }
                if (!editing) setEntryDone(true);
            }
            if (canRecur && recurring) {
                const sres = await fetch("/api/schedules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customerId: customer.id, description, type,
                        quantity: Number(quantity), amount: dollarsToCents(amount),
                        cron: cron.trim(), active: true, invoiceGroupId: groupId,
                    }),
                });
                if (!sres.ok) {
                    const b = await sres.json().catch(() => ({}));
                    setError(`Entry created, but the recurring schedule failed: ${b.error?.message ?? "error"}`);
                    return;
                }
            }
            onSaved();
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal open onClose={onClose} title={editing ? "Edit Invoice Entry" : "New Invoice Entry"}>
            <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="mb-3">
                    <label className="form-label fw-semibold">Customer</label>
                    {fixedCustomer ? (
                        <input className="form-control" value={fixedCustomer.name} readOnly disabled />
                    ) : (
                        <CustomerTypeahead selectedName={customer?.name} onSelect={pickCustomer} />
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="entry-description" className="form-label fw-semibold">Description</label>
                    <input id="entry-description" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold">Invoice Group <span className="text-muted fw-normal">(optional)</span></label>
                    <InvoiceGroupTypeahead
                        key={customer?.id ?? "none"}
                        customerId={customer?.id ?? null}
                        selectedName={groupName ?? undefined}
                        onSelect={(g) => { setGroupId(g?.id ?? null); setGroupName(g?.name ?? null); }}
                    />
                    <div className="form-text">Grouped entries collapse into one line on the invoice.</div>
                </div>

                <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                        <label htmlFor="entry-type" className="form-label fw-semibold">Type</label>
                        <select id="entry-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="bill">Billable</option>
                            <option value="software">Software</option>
                        </select>
                    </div>
                    <div className="col-12 col-sm-6">
                        <label htmlFor="entry-date" className="form-label fw-semibold">Date</label>
                        <input id="entry-date" className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                </div>

                <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" id="entry-track" checked={trackTime} onChange={(e) => toggleTrack(e.target.checked)} />
                    <label className="form-check-label fw-semibold" htmlFor="entry-track">Track time</label>
                </div>

                {trackTime ? (
                    <>
                        <div className="row g-3 mb-2">
                            <div className="col-6 col-sm-4">
                                <label htmlFor="entry-start" className="form-label small fw-semibold">Start</label>
                                <select id="entry-start" className="form-select" value={startT} onChange={(e) => setStartT(e.target.value)}>
                                    <option value="">—</option>
                                    {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="col-6 col-sm-4">
                                <label htmlFor="entry-end" className="form-label small fw-semibold">End</label>
                                <select id="entry-end" className="form-select" value={endT} onChange={(e) => setEndT(e.target.value)}>
                                    <option value="">— (run timer)</option>
                                    {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="col-12 col-sm-4">
                                <label htmlFor="entry-rate" className="form-label small fw-semibold">Hourly Rate</label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input id="entry-rate" className="form-control" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                    <span className="input-group-text">/ hr</span>
                                </div>
                            </div>
                        </div>
                        <div className="small mb-2">
                            {!startT ? (
                                <span className="text-muted">Pick a start time. Leave End blank to start a running timer.</span>
                            ) : !endT ? (
                                <span className="text-primary">Saving will start a running timer.</span>
                            ) : !validRange ? (
                                <span className="text-danger">End time must be after start time.</span>
                            ) : (
                                <span className="text-muted">
                                    Quantity <span className="fw-semibold text-body">{formatHours(timedHours)}</span> · Amount{" "}
                                    <span className="fw-semibold text-body">{formatUSD(Math.round(rateCents * timedHours))}</span>
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="row g-3">
                            <div className="col-6">
                                <label htmlFor="entry-qty" className="form-label fw-semibold">Quantity</label>
                                <input id="entry-qty" className="form-control" type="number" min={0} step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                            </div>
                            <div className="col-6">
                                <label htmlFor="entry-amount" className="form-label fw-semibold">Amount (each)</label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input id="entry-amount" className="form-control" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                </div>
                            </div>
                        </div>
                        <div className="small text-muted mt-2">
                            Line total{" "}
                            <span className="fw-semibold text-body">
                                {formatUSD(Math.round(dollarsToCents(amount) * (Number(quantity) || 0)))}
                            </span>
                        </div>

                        {canRecur && (
                            <div className="mt-3">
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="entry-recurring" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
                                    <label className="form-check-label fw-semibold" htmlFor="entry-recurring">Make recurring</label>
                                </div>
                                {recurring && (
                                    <div className="mt-2">
                                        <label htmlFor="entry-cron" className="form-label small fw-semibold">Schedule (cron)</label>
                                        <CronField id="entry-cron" value={cron} onChange={setCron} />
                                        <div className="form-text">Creates this entry now and again on the schedule.</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving…" : editing ? "Save Changes" : "Create Entry"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
