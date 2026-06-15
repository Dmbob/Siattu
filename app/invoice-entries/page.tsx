import { InvoiceEntryService } from "@/lib/service/InvoiceEntryService";
import InvoiceEntryTable from "@/components/InvoiceEntryTable";

export default async function InvoiceEntriesPage() {
    const entries = await new InvoiceEntryService().listWithCustomer();

    return (
        <main className="container py-4">
            <h1 className="h3 fw-bold mb-4">Invoice Entries</h1>
            <div className="card shadow-sm">
                <div className="card-body">
                    <InvoiceEntryTable entries={entries} />
                </div>
            </div>
        </main>
    );
}
