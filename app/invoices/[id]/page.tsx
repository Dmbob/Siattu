import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { InvoiceService } from "@/lib/service/InvoiceService";
import { formatUSD } from "@/lib/money";
import { sumEntryLineTotals } from "@/lib/models/InvoiceEntry";
import { collapseEntriesIntoInvoiceLines } from "@/lib/models/InvoiceGroup";
import { formatHours } from "@/lib/time";
import type { InvoiceDetailEntry } from "@/lib/service/InvoiceService";
import InvoiceStatusButton from "@/components/InvoiceStatusButton";

function fmtDate(d: Date): string {
    return new Date(d).toLocaleDateString();
}

/** A titled line-item table for one entry type, with its own total. */
function EntrySection({ title, entries }: { title: string; entries: InvoiceDetailEntry[] }) {
    if (entries.length === 0) return null;
    return (
        <div className="mb-4">
            <h2 className="h6 fw-bold text-primary mb-2">{title}</h2>
            <div className="table-responsive">
                <table className="table align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th className="text-end">Qty</th>
                            <th className="text-end">Rate</th>
                            <th className="text-end">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {collapseEntriesIntoInvoiceLines(entries).map((line) => (
                            <tr key={line.key}>
                                <td className="text-nowrap">
                                    {line.dateStart.getTime() === line.dateEnd.getTime()
                                        ? fmtDate(line.dateStart)
                                        : `${fmtDate(line.dateStart)} – ${fmtDate(line.dateEnd)}`}
                                </td>
                                <td>{line.description}</td>
                                <td className="text-end">{line.quantityIsHours ? formatHours(line.quantity) : line.quantity}</td>
                                <td className="text-end" style={{ whiteSpace: "pre-line" }}>{line.rateDisplay}</td>
                                <td className="text-end">{formatUSD(line.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-top">
                            <th colSpan={4} className="text-end">Total</th>
                            <th className="text-end">{formatUSD(sumEntryLineTotals(entries))}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/signin");

    const { id } = await params;
    const inv = await new InvoiceService().getDetail(session.user.id, id);
    if (!inv) notFound();

    const paid = inv.status === "paid";
    const billable = inv.entries.filter((e) => e.type !== "software");
    const software = inv.entries.filter((e) => e.type === "software");

    return (
        <main className="container py-4">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
                <div>
                    <Link href="/invoices" className="text-decoration-none small">&larr; All invoices</Link>
                    <h1 className="h3 fw-bold mb-0">Invoice #{inv.invoiceNumber}</h1>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${paid ? "text-bg-success" : "text-bg-warning"}`}>{paid ? "Paid" : "Unpaid"}</span>
                    <InvoiceStatusButton invoiceId={inv.id} status={inv.status} />
                    <a href={`/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                        Open PDF
                    </a>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <div className="row g-3 mb-3">
                                <div className="col-6">
                                    <div className="text-uppercase small text-muted fw-semibold">Bill To</div>
                                    <div className="fw-semibold">
                                        <Link href={`/customers/${inv.customer.id}`} className="text-decoration-none">
                                            {inv.customer.name}
                                        </Link>
                                    </div>
                                    <address className="text-muted mb-0 small">
                                        <div>{inv.customer.address.street1}{inv.customer.address.street2 ? `, ${inv.customer.address.street2}` : ""}</div>
                                        <div>{inv.customer.address.city}, {inv.customer.address.region} {inv.customer.address.postalCode}</div>
                                    </address>
                                </div>
                                <div className="col-6">
                                    <div className="text-uppercase small text-muted fw-semibold">Date</div>
                                    <div>{fmtDate(inv.date)}</div>
                                </div>
                            </div>

                            <EntrySection title="Billable Work" entries={billable} />
                            <EntrySection title="Software/Licenses" entries={software} />
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-body p-2 p-md-3 d-flex flex-column">
                            <iframe
                                title={`Invoice ${inv.invoiceNumber} PDF`}
                                src={`/invoices/${inv.id}/pdf?v=${inv.status}-${inv.total}`}
                                className="w-100 border rounded flex-grow-1"
                                style={{ minHeight: "70vh" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
