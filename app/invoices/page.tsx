import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { InvoiceService } from "@/lib/service/InvoiceService";
import { formatUSD } from "@/lib/money";

function fmtDate(d: Date): string {
    return new Date(d).toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
    return status === "paid" ? (
        <span className="badge text-bg-success">Paid</span>
    ) : (
        <span className="badge text-bg-warning">Unpaid</span>
    );
}

export default async function InvoicesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/signin");

    const invoices = await new InvoiceService().listAll(session.user.id);

    return (
        <main className="container py-4">
            <h1 className="h3 fw-bold mb-4">Invoices</h1>

            {invoices.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        No invoices yet. Open a customer and use the{" "}
                        <span className="fw-semibold">Invoices</span> tab to create one from unbilled entries.
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th className="text-end">Entries</th>
                                    <th className="text-end">Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td>
                                            <Link href={`/invoices/${inv.id}`} className="fw-semibold text-decoration-none">
                                                {inv.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td className="text-nowrap">{fmtDate(inv.date)}</td>
                                        <td>
                                            <Link href={`/customers/${inv.customerId}`} className="text-decoration-none">
                                                {inv.customerName}
                                            </Link>
                                        </td>
                                        <td className="text-end">{inv.entryCount}</td>
                                        <td className="text-end">{formatUSD(inv.total)}</td>
                                        <td><StatusBadge status={inv.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
}
