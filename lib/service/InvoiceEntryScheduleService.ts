import { InvoiceEntrySchedule } from '@/app/generated/prisma/client';
import { CronExpressionParser } from 'cron-parser';
import { prisma } from '@/lib/prisma';
import { ScheduleInput, ScheduleListItem } from '@/lib/models/InvoiceEntrySchedule';

export class InvoiceEntryScheduleService implements Service<InvoiceEntrySchedule> {
    async get(id: string): Promise<InvoiceEntrySchedule | null> {
        return await prisma.invoiceEntrySchedule.findFirst({ where: { id } });
    }
    async upsert(obj: InvoiceEntrySchedule): Promise<InvoiceEntrySchedule> {
        return await prisma.invoiceEntrySchedule.upsert({ where: { id: obj.id }, create: obj, update: obj });
    }
    async delete(id: string): Promise<InvoiceEntrySchedule> {
        return await prisma.invoiceEntrySchedule.delete({ where: { id } });
    }
    async list(offset: number, pageSize: number): Promise<InvoiceEntrySchedule[]> {
        return await prisma.invoiceEntrySchedule.findMany({ skip: offset, take: pageSize });
    }

    /** Schedules for one customer, newest first. */
    async listForCustomer(customerId: string): Promise<ScheduleListItem[]> {
        return await prisma.invoiceEntrySchedule.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, description: true, type: true, quantity: true, amount: true,
                cron: true, active: true, lastRunAt: true, createdAt: true,
            },
        });
    }

    async create(serviceProviderId: string, input: ScheduleInput): Promise<InvoiceEntrySchedule> {
        await this.assertOwnsCustomer(serviceProviderId, input.customerId);
        return await prisma.invoiceEntrySchedule.create({
            data: {
                customerId: input.customerId,
                description: input.description,
                type: input.type,
                quantity: input.quantity,
                amount: input.amount,
                cron: input.cron,
                active: input.active,
            },
        });
    }

    async update(serviceProviderId: string, id: string, input: ScheduleInput): Promise<void> {
        await this.assertOwnsSchedule(serviceProviderId, id);
        await prisma.invoiceEntrySchedule.update({
            where: { id },
            data: {
                description: input.description,
                type: input.type,
                quantity: input.quantity,
                amount: input.amount,
                cron: input.cron,
                active: input.active,
            },
        });
    }

    async remove(serviceProviderId: string, id: string): Promise<void> {
        await this.assertOwnsSchedule(serviceProviderId, id);
        await prisma.invoiceEntrySchedule.delete({ where: { id } });
    }

    /**
     * Create entries for every active schedule whose cron has fired since it last
     * ran. The previous fire time (≤ now) is compared against `lastRunAt` (or
     * `createdAt` for a never-run schedule), so each occurrence fires once and a
     * freshly created schedule won't back-fill past occurrences.
     */
    async runDue(now: Date = new Date()): Promise<number> {
        const schedules = await prisma.invoiceEntrySchedule.findMany({
            where: { active: true },
            select: {
                id: true, customerId: true, description: true, type: true,
                quantity: true, amount: true, cron: true, lastRunAt: true, createdAt: true,
            },
        });

        let created = 0;
        for (const s of schedules) {
            try {
                const prevFire = CronExpressionParser.parse(s.cron, { currentDate: now }).prev().toDate();
                const baseline = s.lastRunAt ?? s.createdAt;
                if (prevFire > baseline) {
                    await prisma.$transaction([
                        prisma.invoiceEntry.create({
                            data: {
                                customerId: s.customerId,
                                description: s.description,
                                type: s.type,
                                amount: s.amount,
                                quantity: s.quantity,
                                date: now,
                            },
                        }),
                        prisma.invoiceEntrySchedule.update({ where: { id: s.id }, data: { lastRunAt: now } }),
                    ]);
                    created++;
                }
            } catch (err) {
                console.error(`[scheduler] schedule ${s.id} failed`, err);
            }
        }
        return created;
    }

    private async assertOwnsCustomer(serviceProviderId: string, customerId: string): Promise<void> {
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, serviceProviderId },
            select: { id: true },
        });
        if (!customer) throw new Error('Customer not found.');
    }

    private async assertOwnsSchedule(serviceProviderId: string, id: string): Promise<void> {
        const schedule = await prisma.invoiceEntrySchedule.findFirst({
            where: { id, customer: { serviceProviderId } },
            select: { id: true },
        });
        if (!schedule) throw new Error('Schedule not found.');
    }
}
