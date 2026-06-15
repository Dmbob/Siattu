import { InvoiceEntry } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { hoursBetween, billableHalfHours } from '@/lib/time';

export interface OpenTimer {
    id: string;
    customerName: string;
    startTime: Date;
}

/** Manages the single "open" time-tracking entry (start time, no end time). */
export class TimeTrackingService {
    async getOpen(): Promise<OpenTimer | null> {
        const e = await prisma.invoiceEntry.findFirst({
            where: { startTime: { not: null }, endTime: null },
            orderBy: { startTime: 'desc' },
            select: { id: true, startTime: true, customer: { select: { name: true } } },
        });
        return e?.startTime ? { id: e.id, customerName: e.customer.name, startTime: e.startTime } : null;
    }

    /** Shortcut for the nav action: open a timer now at the customer's rate. */
    async start(serviceProviderId: string, customerId: string, description: string): Promise<InvoiceEntry> {
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, serviceProviderId },
            select: { defaultEntryAmount: true },
        });
        if (!customer) throw new Error('Customer not found.');
        if (await this.getOpen()) throw new Error('A timer is already running.');
        const now = new Date();
        return await prisma.invoiceEntry.create({
            data: {
                customerId,
                description: description || 'Time tracking',
                type: 'bill',
                date: now,
                startTime: now,
                quantity: 0,
                amount: customer.defaultEntryAmount, // amount holds the hourly rate
            },
        });
    }

    /** Stops the open timer (if any), rounding elapsed time to the nearest half hour. */
    async stop(): Promise<InvoiceEntry | null> {
        const open = await prisma.invoiceEntry.findFirst({
            where: { startTime: { not: null }, endTime: null },
            orderBy: { startTime: 'desc' },
        });
        if (!open || !open.startTime) return null;

        const end = new Date();
        const quantity = billableHalfHours(hoursBetween(open.startTime, end));
        // amount (the hourly rate) is left as-is; the line total is rate × quantity.
        return await prisma.invoiceEntry.update({ where: { id: open.id }, data: { endTime: end, quantity } });
    }
}
