import { Invoice } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class InvoiceService implements Service<Invoice> {
    async get(id: string): Promise<Invoice | null> {
        return await prisma.invoice.findFirst({where: { id }});
    }
    async upsert(obj: Invoice): Promise<Invoice> {
        return await prisma.invoice.upsert({where: {id: obj.id}, create: obj, update: obj});
    }
    async delete(id: string): Promise<Invoice> {
        return await prisma.invoice.delete({where: { id }});
    }
    async list(offset: number, pageSize: number): Promise<Invoice[]> {
        return await prisma.invoice.findMany({skip: offset, take: pageSize});
    }
}