import { redirect } from "next/navigation";
import { ServiceProviderService } from "@/lib/service/ServiceProviderService";
import { ReportService } from "@/lib/service/ReportService";
import { formatUSD } from "@/lib/money";
import { formatHours } from "@/lib/time";
import InProgressBanner from "@/components/InProgressBanner";

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="col-12 col-sm-6 col-lg-4 col-xl">
            <div className="card shadow-sm h-100">
                <div className="card-body">
                    <div className="text-secondary text-uppercase small fw-semibold mb-2">{label}</div>
                    <div className="h3 fw-bold mb-0 text-primary">{value}</div>
                </div>
            </div>
        </div>
    );
}

export default async function Home() {
    const sps = new ServiceProviderService();
    const providers = await sps.list(0, 1);
    if (providers.length === 0) redirect("/setup");

    const report = await new ReportService().getDashboard();
    const year = new Date().getFullYear();

    return (
        <main className="container py-4">
            <h1 className="h3 fw-bold mb-4">Dashboard</h1>

            {report.inProgress && (
                <InProgressBanner
                    customerName={report.inProgress.customerName}
                    startTime={report.inProgress.startTime.toISOString()}
                />
            )}

            <div className="row g-3">
                <StatCard label="Hours Worked (This Year)" value={formatHours(report.hoursWorked)} />
                <StatCard label="Unpaid Invoices" value={String(report.unpaidInvoiceCount)} />
                <StatCard label="Unbilled Amount" value={formatUSD(report.unbilledAmount)} />
                <StatCard label="Unbilled Time" value={formatHours(report.unbilledHours)} />
                <StatCard label={`Invoiced (${year})`} value={formatUSD(report.invoicedThisYear)} />
            </div>
        </main>
    );
}
