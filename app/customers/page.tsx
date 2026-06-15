import Link from "next/link";
import { ReportService } from "@/lib/service/ReportService";
import { formatUSD } from "@/lib/money";
import { formatHours } from "@/lib/time";
import NewCustomerButton from "@/components/NewCustomerButton";

export default async function CustomersPage() {
    const customers = await new ReportService().customerList();

    return (
        <main className="container py-4">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
                <h1 className="h3 fw-bold mb-0">Customers</h1>
                <NewCustomerButton />
            </div>

            {customers.length === 0 ? (
                <div className="card shadow-sm">
                    <div className="card-body text-center text-muted py-5">
                        No customers yet. Click <span className="fw-semibold">New Customer</span> to add one.
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th className="text-end">Unbilled Hours</th>
                                    <th className="text-end">Unbilled Amount</th>
                                    <th className="text-end">Billed This Year</th>
                                    <th className="text-end">Pending Invoices</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <Link href={`/customers/${c.id}`} className="fw-semibold text-decoration-none">
                                                {c.name}
                                            </Link>
                                        </td>
                                        <td className="text-end">{formatHours(c.unbilledHours)}</td>
                                        <td className="text-end">{formatUSD(c.unbilledAmount)}</td>
                                        <td className="text-end">{formatUSD(c.billedThisYear)}</td>
                                        <td className="text-end">{c.pendingInvoiceCount}</td>
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
