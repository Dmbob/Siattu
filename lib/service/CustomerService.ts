import { Customer } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class CustomerService implements Service<Customer> {
    async get(id: string): Promise<Customer | null> {
        return await prisma.customer.findFirst({where: { id }});
    }
    async upsert(obj: Customer): Promise<Customer> {
        return await prisma.customer.upsert({where: {id: obj.id}, create: obj, update: obj});
    }
    async delete(id: string): Promise<Customer> {
        return await prisma.customer.delete({where: { id }});
    }
    async list(offset: number, pageSize: number): Promise<Customer[]> {
        return await prisma.customer.findMany({skip: offset, take: pageSize});
    }
}