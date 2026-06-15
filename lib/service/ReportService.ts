import { prisma } from '@/lib/prisma';
import { hoursBetween } from '@/lib/time';
import { entryLineTotal } from '@/lib/models/InvoiceEntry';

export interface DashboardSummary {
    /** Total hours tracked on entries started during the current year. */
    hoursWorked: number;
    /** Count of invoices still in the `open` (unpaid) status. */
    unpaidInvoiceCount: number;
    /** Sum (cents) of the line total of every entry not yet attached to an invoice. */
    unbilledAmount: number;
    /** Total hours on time-tracked entries not yet attached to an invoice. */
    unbilledHours: number;
    /** Sum (cents) of the line total of every entry on invoices dated this year. */
    invoicedThisYear: number;
    /** The currently-running time entry, if any. */
    inProgress: { customerName: string; startTime: Date } | null;
}

export interface CustomerRow {
    id: string;
    name: string;
    unbilledHours: number;
    unbilledAmount: number;
    billedThisYear: number;
    pendingInvoiceCount: number;
}

type LineItem = { amount: number; quantity: number; startTime: Date | null; endTime?: Date | null };

/** Read-only aggregate queries that power the dashboard and customer list. */
export class ReportService {
    async getDashboard(now: Date = new Date()): Promise<DashboardSummary> {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

        const [unbilled, unpaidInvoiceCount, invoicedThisYearEntries, yearTimeEntries, openEntry] = await Promise.all([
            prisma.invoiceEntry.findMany({
                where: { invoiceId: null },
                select: { amount: true, quantity: true, startTime: true, endTime: true },
            }),
            prisma.invoice.count({ where: { status: 'open' } }),
            prisma.invoiceEntry.findMany({
                where: { invoice: { date: { gte: yearStart, lt: yearEnd } } },
                select: { amount: true, quantity: true, startTime: true },
            }),
            prisma.invoiceEntry.findMany({
                where: { startTime: { gte: yearStart, lt: yearEnd }, endTime: { not: null } },
                select: { startTime: true, endTime: true },
            }),
            prisma.invoiceEntry.findFirst({
                where: { startTime: { not: null }, endTime: null },
                orderBy: { startTime: 'desc' },
                select: { startTime: true, customer: { select: { name: true } } },
            }),
        ]);

        return {
            hoursWorked: this.sumHours(yearTimeEntries),
            unpaidInvoiceCount,
            unbilledAmount: this.sumLineTotals(unbilled),
            unbilledHours: this.sumHours(unbilled),
            invoicedThisYear: this.sumLineTotals(invoicedThisYearEntries),
            inProgress: openEntry?.startTime
                ? { customerName: openEntry.customer.name, startTime: openEntry.startTime }
                : null,
        };
    }

    /** Per-customer roll-up for the customer list table. */
    async customerList(now: Date = new Date()): Promise<CustomerRow[]> {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

        const [customers, unbilledEntries, billedEntries, pendingInvoices] = await Promise.all([
            prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.invoiceEntry.findMany({
                where: { invoiceId: null },
                select: { customerId: true, amount: true, quantity: true, startTime: true, endTime: true },
            }),
            prisma.invoiceEntry.findMany({
                where: { invoice: { date: { gte: yearStart, lt: yearEnd } } },
                select: { customerId: true, amount: true, quantity: true, startTime: true },
            }),
            prisma.invoice.groupBy({ by: ['customerId'], where: { status: 'open' }, _count: { _all: true } }),
        ]);

        const unbilledAmount = new Map<string, number>();
        const unbilledHours = new Map<string, number>();
        for (const e of unbilledEntries) {
            unbilledAmount.set(e.customerId, (unbilledAmount.get(e.customerId) ?? 0) + entryLineTotal(e));
            if (e.startTime && e.endTime) {
                unbilledHours.set(e.customerId, (unbilledHours.get(e.customerId) ?? 0) + hoursBetween(e.startTime, e.endTime));
            }
        }
        const billed = new Map<string, number>();
        for (const e of billedEntries) {
            billed.set(e.customerId, (billed.get(e.customerId) ?? 0) + entryLineTotal(e));
        }
        const pending = new Map(pendingInvoices.map((r) => [r.customerId, r._count._all]));

        return customers.map((c) => ({
            id: c.id,
            name: c.name,
            unbilledHours: unbilledHours.get(c.id) ?? 0,
            unbilledAmount: unbilledAmount.get(c.id) ?? 0,
            billedThisYear: billed.get(c.id) ?? 0,
            pendingInvoiceCount: pending.get(c.id) ?? 0,
        }));
    }

    private sumLineTotals(entries: LineItem[]): number {
        return entries.reduce((total, e) => total + entryLineTotal(e), 0);
    }

    private sumHours(entries: { startTime: Date | null; endTime?: Date | null }[]): number {
        return entries.reduce(
            (total, e) => total + (e.startTime && e.endTime ? hoursBetween(e.startTime, e.endTime) : 0),
            0,
        );
    }
}
