import { InvoiceEntry } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

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
    async list(offset: number, pageSize: number): Promise<InvoiceEntry[]> {
        return await prisma.invoiceEntry.findMany({skip: offset, take: pageSize});
    }
}