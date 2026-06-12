import { Address } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class AddressService implements Service<Address> {
    async get(id: string): Promise<Address | null> {
        return await prisma.address.findFirst({where: { id }});
    }
    async upsert(obj: Address): Promise<Address> {
        return await prisma.address.upsert({where: {id: obj.id}, create: obj, update: obj});
    }
    async delete(id: string): Promise<Address> {
        return await prisma.address.delete({where: { id }});
    }
    async list(offset: number, pageSize: number): Promise<Address[]> {
        return await prisma.address.findMany({skip: offset, take: pageSize});
    }
}