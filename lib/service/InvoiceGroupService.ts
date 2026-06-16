import { InvoiceGroup } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { InvoiceGroupInput, InvoiceGroupListItem, InvoiceGroupOption } from '@/lib/models/InvoiceGroup';

export class InvoiceGroupService implements Service<InvoiceGroup> {
    async get(id: string): Promise<InvoiceGroup | null> {
        return await prisma.invoiceGroup.findFirst({ where: { id } });
    }
    async upsert(obj: InvoiceGroup): Promise<InvoiceGroup> {
        return await prisma.invoiceGroup.upsert({ where: { id: obj.id }, create: obj, update: obj });
    }
    async delete(id: string): Promise<InvoiceGroup> {
        return await prisma.invoiceGroup.delete({ where: { id } });
    }
    async list(offset: number, pageSize: number): Promise<InvoiceGroup[]> {
        return await prisma.invoiceGroup.findMany({ skip: offset, take: pageSize });
    }

    /** Groups for one customer (with reference counts), newest first. */
    async listForCustomer(customerId: string): Promise<InvoiceGroupListItem[]> {
        const groups = await prisma.invoiceGroup.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                invoiceDescription: true,
                _count: { select: { entries: true, schedules: true } },
            },
        });
        return groups.map((g) => ({
            id: g.id,
            name: g.name,
            invoiceDescription: g.invoiceDescription,
            entryCount: g._count.entries,
            scheduleCount: g._count.schedules,
        }));
    }

    /** Name search for the customer-scoped group typeahead, ownership-checked. */
    async search(
        serviceProviderId: string,
        customerId: string,
        q: string,
        limit = 10,
    ): Promise<InvoiceGroupOption[]> {
        return await prisma.invoiceGroup.findMany({
            where: {
                customerId,
                customer: { serviceProviderId },
                ...(q ? { name: { contains: q } } : {}),
            },
            select: { id: true, name: true, invoiceDescription: true },
            orderBy: { name: 'asc' },
            take: limit,
        });
    }

    async create(serviceProviderId: string, input: InvoiceGroupInput): Promise<InvoiceGroup> {
        await this.assertOwnsCustomer(serviceProviderId, input.customerId);
        return await prisma.invoiceGroup.create({
            data: {
                customerId: input.customerId,
                name: input.name,
                invoiceDescription: input.invoiceDescription,
            },
        });
    }

    async update(serviceProviderId: string, id: string, input: InvoiceGroupInput): Promise<void> {
        await this.assertOwnsGroup(serviceProviderId, id);
        await prisma.invoiceGroup.update({
            where: { id },
            data: { name: input.name, invoiceDescription: input.invoiceDescription },
        });
    }

    /**
     * Delete a group. Blocked while anything still references it — any entry
     * (including ones already billed onto an invoice) or any schedule. Past
     * invoices keep their snapshotted label regardless.
     */
    async remove(serviceProviderId: string, id: string): Promise<void> {
        await this.assertOwnsGroup(serviceProviderId, id);
        const counts = await prisma.invoiceGroup.findUnique({
            where: { id },
            select: { _count: { select: { entries: true, schedules: true } } },
        });
        if (counts && (counts._count.entries > 0 || counts._count.schedules > 0)) {
            throw new Error('This group is in use by entries or schedules and cannot be deleted.');
        }
        await prisma.invoiceGroup.delete({ where: { id } });
    }

    private async assertOwnsCustomer(serviceProviderId: string, customerId: string): Promise<void> {
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, serviceProviderId },
            select: { id: true },
        });
        if (!customer) throw new Error('Customer not found.');
    }

    private async assertOwnsGroup(serviceProviderId: string, id: string): Promise<void> {
        const group = await prisma.invoiceGroup.findFirst({
            where: { id, customer: { serviceProviderId } },
            select: { id: true },
        });
        if (!group) throw new Error('Invoice group not found.');
    }
}
