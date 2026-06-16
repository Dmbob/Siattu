import { notFound } from "next/navigation";
import { CustomerService } from "@/lib/service/CustomerService";
import { InvoiceEntryService } from "@/lib/service/InvoiceEntryService";
import { InvoiceService } from "@/lib/service/InvoiceService";
import { InvoiceEntryScheduleService } from "@/lib/service/InvoiceEntryScheduleService";
import { InvoiceGroupService } from "@/lib/service/InvoiceGroupService";
import CustomerTabs from "@/components/CustomerTabs";
import EditCustomerButton from "@/components/EditCustomerButton";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const customer = await new CustomerService().getWithAddress(id);
    if (!customer) notFound();

    const [entries, invoices, schedules, groups] = await Promise.all([
        new InvoiceEntryService().listWithCustomer(id),
        new InvoiceService().listForCustomer(id),
        new InvoiceEntryScheduleService().listForCustomer(id),
        new InvoiceGroupService().listForCustomer(id),
    ]);

    const { address } = customer;

    return (
        <main className="container py-4">
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                        <h1 className="h4 fw-bold mb-0">{customer.name}</h1>
                        <EditCustomerButton
                            customerId={customer.id}
                            name={customer.name}
                            address={{
                                street1: address.street1,
                                street2: address.street2,
                                city: address.city,
                                region: address.region,
                                postalCode: address.postalCode,
                            }}
                        />
                    </div>
                    <address className="text-muted mb-0">
                        <div>
                            {address.street1}
                            {address.street2 ? `, ${address.street2}` : ""}
                        </div>
                        <div>
                            {address.city}, {address.region} {address.postalCode}
                        </div>
                    </address>
                </div>
            </div>

            <CustomerTabs
                customerId={customer.id}
                customerName={customer.name}
                entries={entries}
                invoices={invoices}
                schedules={schedules}
                groups={groups}
                startingInvoiceNumber={customer.startingInvoiceNumber}
                defaultEntryAmount={customer.defaultEntryAmount}
            />
        </main>
    );
}
