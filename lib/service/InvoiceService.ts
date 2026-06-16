import type { Address, Invoice } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { sumEntryLineTotals } from '@/lib/models/InvoiceEntry';

/** A row in an invoice list (global or per-customer). */
export interface InvoiceListRow {
    id: string;
    invoiceNumber: number;
    date: Date;
    status: string;
    customerId: string;
    customerName: string;
    total: number; // cents
    entryCount: number;
}

/** A single billable line on an invoice. */
export interface InvoiceDetailEntry {
    id: string;
    description: string;
    type: string;
    quantity: number;
    amount: number; // per-unit cents (hourly rate when timed)
    date: Date;
    startTime: Date | null;
    endTime: Date | null;
    invoiceGroupId: string | null;
    invoiceGroupLabel: string | null; // group description snapshotted at invoice creation
}

/** Everything needed to render an invoice page or PDF. */
export interface InvoiceDetail {
    id: string;
    invoiceNumber: number;
    date: Date;
    status: string;
    total: number; // cents
    customer: { id: string; name: string; address: Address };
    serviceProvider: { firstName: string; lastName: string; address: Address };
    entries: InvoiceDetailEntry[];
}

const LIST_SELECT = {
    id: true,
    invoiceNumber: true,
    date: true,
    status: true,
    customer: { select: { id: true, name: true } },
    invoiceEntries: { select: { amount: true, quantity: true } },
} as const;

type ListResult = {
    id: string;
    invoiceNumber: number;
    date: Date;
    status: string;
    customer: { id: string; name: string };
    invoiceEntries: { amount: number; quantity: number }[];
};

export class InvoiceService implements Service<Invoice> {
    async get(id: string): Promise<Invoice | null> {
        return await prisma.invoice.findFirst({ where: { id } });
    }
    async upsert(obj: Invoice): Promise<Invoice> {
        return await prisma.invoice.upsert({ where: { id: obj.id }, create: obj, update: obj });
    }
    async delete(id: string): Promise<Invoice> {
        return await prisma.invoice.delete({ where: { id } });
    }
    async list(offset: number, pageSize: number): Promise<Invoice[]> {
        return await prisma.invoice.findMany({ skip: offset, take: pageSize });
    }

    /**
     * The next per-customer invoice number: one past the customer's highest
     * existing number, or the customer's `startingInvoiceNumber` when none exist.
     */
    async nextInvoiceNumber(customerId: string): Promise<number> {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { startingInvoiceNumber: true },
        });
        if (!customer) throw new Error('Customer not found.');
        const last = await prisma.invoice.findFirst({
            where: { customerId },
            orderBy: { invoiceNumber: 'desc' },
            select: { invoiceNumber: true },
        });
        return last ? last.invoiceNumber + 1 : customer.startingInvoiceNumber;
    }

    /**
     * Create an invoice from a set of the customer's unbilled entries, assigning
     * the next per-customer number and marking those entries billed — all in one
     * transaction so the number stays gap-safe under concurrency.
     */
    async createFromEntries(
        serviceProviderId: string,
        customerId: string,
        entryIds: string[],
        date: Date,
    ): Promise<Invoice> {
        if (entryIds.length === 0) throw new Error('Select at least one entry to invoice.');
        return await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findFirst({
                where: { id: customerId, serviceProviderId },
                select: { startingInvoiceNumber: true },
            });
            if (!customer) throw new Error('Customer not found.');

            const entries = await tx.invoiceEntry.findMany({
                where: { id: { in: entryIds }, customerId, invoiceId: null },
                select: { id: true, startTime: true, endTime: true, invoiceGroupId: true },
            });
            if (entries.length !== entryIds.length) {
                throw new Error('Some selected entries are no longer available to invoice.');
            }
            if (entries.some((e) => e.startTime && !e.endTime)) {
                throw new Error('A running timer cannot be invoiced — stop it first.');
            }

            const last = await tx.invoice.findFirst({
                where: { customerId },
                orderBy: { invoiceNumber: 'desc' },
                select: { invoiceNumber: true },
            });
            const invoiceNumber = last ? last.invoiceNumber + 1 : customer.startingInvoiceNumber;

            const invoice = await tx.invoice.create({
                data: { customerId, date, invoiceNumber, status: 'open' },
            });
            await tx.invoiceEntry.updateMany({
                where: { id: { in: entries.map((e) => e.id) } },
                data: { invoiceId: invoice.id, billed: true },
            });

            // Freeze each grouped entry's label so renaming a group later never
            // alters this invoice (snapshot at issue time).
            const groupIds = [...new Set(entries.map((e) => e.invoiceGroupId).filter((id): id is string => !!id))];
            if (groupIds.length > 0) {
                const groups = await tx.invoiceGroup.findMany({
                    where: { id: { in: groupIds } },
                    select: { id: true, invoiceDescription: true },
                });
                for (const g of groups) {
                    await tx.invoiceEntry.updateMany({
                        where: { id: { in: entries.filter((e) => e.invoiceGroupId === g.id).map((e) => e.id) } },
                        data: { invoiceGroupLabel: g.invoiceDescription },
                    });
                }
            }
            return invoice;
        });
    }

    /** Flip an invoice between `open` (unpaid) and `paid`. */
    async setStatus(serviceProviderId: string, id: string, status: 'open' | 'paid'): Promise<void> {
        const invoice = await prisma.invoice.findFirst({
            where: { id, customer: { serviceProviderId } },
            select: { id: true },
        });
        if (!invoice) throw new Error('Invoice not found.');
        await prisma.invoice.update({ where: { id }, data: { status } });
    }

    /** All invoices for the provider, newest first. */
    async listAll(serviceProviderId: string): Promise<InvoiceListRow[]> {
        const invoices = await prisma.invoice.findMany({
            where: { customer: { serviceProviderId } },
            orderBy: [{ date: 'desc' }, { invoiceNumber: 'desc' }],
            select: LIST_SELECT,
        });
        return invoices.map(toListRow);
    }

    /** Invoices for a single customer, newest first. */
    async listForCustomer(customerId: string): Promise<InvoiceListRow[]> {
        const invoices = await prisma.invoice.findMany({
            where: { customerId },
            orderBy: [{ date: 'desc' }, { invoiceNumber: 'desc' }],
            select: LIST_SELECT,
        });
        return invoices.map(toListRow);
    }

    /** Full invoice (customer + provider addresses + line items), ownership-checked. */
    async getDetail(serviceProviderId: string, id: string): Promise<InvoiceDetail | null> {
        const inv = await prisma.invoice.findFirst({
            where: { id, customer: { serviceProviderId } },
            select: {
                id: true,
                invoiceNumber: true,
                date: true,
                status: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        serviceProvider: { select: { firstName: true, lastName: true, address: true } },
                    },
                },
                invoiceEntries: {
                    select: {
                        id: true, description: true, type: true, quantity: true,
                        amount: true, date: true, startTime: true, endTime: true,
                        invoiceGroupId: true, invoiceGroupLabel: true,
                    },
                    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
                },
            },
        });
        if (!inv) return null;
        return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            date: inv.date,
            status: inv.status,
            total: sumEntryLineTotals(inv.invoiceEntries),
            customer: { id: inv.customer.id, name: inv.customer.name, address: inv.customer.address },
            serviceProvider: inv.customer.serviceProvider,
            entries: inv.invoiceEntries,
        };
    }
}

function toListRow(inv: ListResult): InvoiceListRow {
    return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        status: inv.status,
        customerId: inv.customer.id,
        customerName: inv.customer.name,
        total: sumEntryLineTotals(inv.invoiceEntries),
        entryCount: inv.invoiceEntries.length,
    };
}
