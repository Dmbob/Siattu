import { InvoiceEntry } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { InvoiceEntryInput, InvoiceEntryListItem } from '@/lib/models/InvoiceEntry';
import { hoursBetween, billableHalfHours } from '@/lib/time';

export class InvoiceEntryService implements Service<InvoiceEntry> {
    async get(id: string): Promise<InvoiceEntry | null> {
        return await prisma.invoiceEntry.findFirst({where: { id }});
    }
    async upsert(obj: InvoiceEntry): Promise<InvoiceEntry> {
        return await prisma.invoiceEntry.upsert({where: {id: obj.id}, create: obj, update: obj});
    }
    async delete(id: string): Promise<InvoiceEntry> {
        return await prisma.invoiceEntry.delete({where: { id }});
    }

    /** Delete an entry, refusing once it has been billed onto an invoice. */
    async deleteEntry(id: string): Promise<void> {
        const entry = await prisma.invoiceEntry.findUnique({ where: { id }, select: { billed: true } });
        if (!entry) throw new Error('Entry not found.');
        if (entry.billed) throw new Error('A billed entry cannot be deleted.');
        await prisma.invoiceEntry.delete({ where: { id } });
    }
    async list(offset: number, pageSize: number): Promise<InvoiceEntry[]> {
        return await prisma.invoiceEntry.findMany({skip: offset, take: pageSize});
    }

    /** Entries (optionally for one customer) with their customer, newest first. */
    async listWithCustomer(customerId?: string): Promise<InvoiceEntryListItem[]> {
        return await prisma.invoiceEntry.findMany({
            where: customerId ? { customerId } : undefined,
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            select: {
                id: true, description: true, type: true, quantity: true, amount: true,
                billed: true, date: true, startTime: true, endTime: true, createdAt: true,
                customer: { select: { id: true, name: true, defaultEntryAmount: true } },
                invoiceGroup: { select: { id: true, name: true } },
            },
        });
    }

    async createEntry(input: InvoiceEntryInput): Promise<InvoiceEntry> {
        await this.assertGroupMatchesCustomer(input.invoiceGroupId, input.customerId);
        const data = this.resolve(input);
        if (data.startTime && !data.endTime) await this.assertNoOtherOpenTimer();
        return await prisma.invoiceEntry.create({ data });
    }

    async updateEntry(id: string, input: InvoiceEntryInput): Promise<InvoiceEntry> {
        const existing = await prisma.invoiceEntry.findUnique({ where: { id }, select: { billed: true } });
        if (!existing) throw new Error('Entry not found.');
        if (existing.billed) throw new Error('A billed entry cannot be edited.');
        await this.assertGroupMatchesCustomer(input.invoiceGroupId, input.customerId);
        const data = this.resolve(input);
        if (data.startTime && !data.endTime) await this.assertNoOtherOpenTimer(id);
        return await prisma.invoiceEntry.update({ where: { id }, data });
    }

    /**
     * Shapes the stored row. For a completed timed entry `quantity` is the
     * elapsed hours (nearest half hour); `amount` always stores the rate (timed)
     * or the line total (non-timed) exactly as supplied.
     */
    private resolve(input: InvoiceEntryInput) {
        const base = {
            customerId: input.customerId, description: input.description, type: input.type,
            date: input.date, invoiceGroupId: input.invoiceGroupId,
        };
        if (input.startTime && input.endTime) {
            const quantity = billableHalfHours(hoursBetween(input.startTime, input.endTime));
            return { ...base, startTime: input.startTime, endTime: input.endTime, quantity, amount: input.amount };
        }
        if (input.startTime) {
            return { ...base, startTime: input.startTime, endTime: null, quantity: 0, amount: input.amount };
        }
        return { ...base, startTime: null, endTime: null, quantity: input.quantity, amount: input.amount };
    }

    /** A chosen group must belong to the same customer the entry is filed under. */
    private async assertGroupMatchesCustomer(invoiceGroupId: string | null, customerId: string) {
        if (!invoiceGroupId) return;
        const group = await prisma.invoiceGroup.findFirst({
            where: { id: invoiceGroupId, customerId },
            select: { id: true },
        });
        if (!group) throw new Error('Invoice group not found.');
    }

    private async assertNoOtherOpenTimer(excludeId?: string) {
        const open = await prisma.invoiceEntry.findFirst({
            where: { startTime: { not: null }, endTime: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
            select: { id: true },
        });
        if (open) throw new Error('A timer is already running.');
    }
}
