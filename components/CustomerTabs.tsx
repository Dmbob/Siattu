"use client";

import { useState } from "react";
import CustomerSettingsForm from "@/components/CustomerSettingsForm";
import InvoiceEntryTable from "@/components/InvoiceEntryTable";
import CustomerInvoices from "@/components/CustomerInvoices";
import CustomerSchedules from "@/components/CustomerSchedules";
import CustomerInvoiceGroups from "@/components/CustomerInvoiceGroups";
import type { InvoiceEntryListItem } from "@/lib/models/InvoiceEntry";
import type { InvoiceListRow } from "@/lib/service/InvoiceService";
import type { ScheduleListItem } from "@/lib/models/InvoiceEntrySchedule";
import type { InvoiceGroupListItem } from "@/lib/models/InvoiceGroup";

const TABS = [
    { id: "entries", label: "Invoice Entries" },
    { id: "groups", label: "Invoice Groups" },
    { id: "invoices", label: "Invoices" },
    { id: "settings", label: "Settings" },
    { id: "schedules", label: "Scheduled Entries" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
    customerId: string;
    customerName: string;
    entries: InvoiceEntryListItem[];
    invoices: InvoiceListRow[];
    schedules: ScheduleListItem[];
    groups: InvoiceGroupListItem[];
    startingInvoiceNumber: number;
    defaultEntryAmount: number;
}

export default function CustomerTabs({ customerId, customerName, entries, invoices, schedules, groups, startingInvoiceNumber, defaultEntryAmount }: Props) {
    const [active, setActive] = useState<TabId>("entries");

    return (
        <>
            <ul className="nav nav-tabs">
                {TABS.map((t) => (
                    <li className="nav-item" key={t.id}>
                        <button
                            type="button"
                            className={`nav-link${active === t.id ? " active" : ""}`}
                            onClick={() => setActive(t.id)}
                        >
                            {t.label}
                        </button>
                    </li>
                ))}
            </ul>

            <div className="border border-top-0 rounded-bottom bg-white p-3 p-md-4">
                {active === "entries" && (
                    <InvoiceEntryTable
                        entries={entries}
                        fixedCustomer={{ id: customerId, name: customerName, defaultEntryAmount }}
                    />
                )}
                {active === "groups" && (
                    <CustomerInvoiceGroups customerId={customerId} groups={groups} />
                )}
                {active === "invoices" && (
                    <CustomerInvoices customerId={customerId} invoices={invoices} entries={entries} />
                )}
                {active === "settings" && (
                    <CustomerSettingsForm
                        customerId={customerId}
                        startingInvoiceNumber={startingInvoiceNumber}
                        defaultEntryAmount={defaultEntryAmount}
                    />
                )}
                {active === "schedules" && (
                    <CustomerSchedules customerId={customerId} schedules={schedules} />
                )}
            </div>
        </>
    );
}
