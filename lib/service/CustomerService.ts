import { Address, Customer } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export interface NewCustomerInput {
    name: string;
    street1: string;
    street2?: string | null;
    city: string;
    region: string;
    postalCode: string;
    serviceProviderId: string;
}

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

    /** Create a customer together with its address in a single transaction. */
    async createWithAddress(input: NewCustomerInput): Promise<Customer> {
        return await prisma.$transaction(async (tx) => {
            const address = await tx.address.create({
                data: {
                    street1: input.street1,
                    street2: input.street2 ?? null,
                    city: input.city,
                    region: input.region,
                    postalCode: input.postalCode,
                },
            });
            return await tx.customer.create({
                data: { name: input.name, addressId: address.id, serviceProviderId: input.serviceProviderId },
            });
        });
    }

    async getWithAddress(id: string): Promise<(Customer & { address: Address }) | null> {
        return await prisma.customer.findFirst({ where: { id }, include: { address: true } });
    }

    async updateSettings(
        id: string,
        settings: { startingInvoiceNumber: number; defaultEntryAmount: number },
    ): Promise<Customer> {
        return await prisma.customer.update({ where: { id }, data: settings });
    }

    /** Update a customer's name and address together (ownership-scoped). */
    async updateProfile(
        serviceProviderId: string,
        id: string,
        profile: { name: string; street1: string; street2?: string | null; city: string; region: string; postalCode: string },
    ): Promise<void> {
        const customer = await prisma.customer.findFirst({
            where: { id, serviceProviderId },
            select: { addressId: true },
        });
        if (!customer) throw new Error('Customer not found.');
        await prisma.$transaction([
            prisma.customer.update({ where: { id }, data: { name: profile.name } }),
            prisma.address.update({
                where: { id: customer.addressId },
                data: {
                    street1: profile.street1,
                    street2: profile.street2 ?? null,
                    city: profile.city,
                    region: profile.region,
                    postalCode: profile.postalCode,
                },
            }),
        ]);
    }

    /** Name search for the customer typeahead, scoped to a service provider. */
    async search(
        serviceProviderId: string,
        q: string,
        limit = 10,
    ): Promise<{ id: string; name: string; defaultEntryAmount: number }[]> {
        return await prisma.customer.findMany({
            where: { serviceProviderId, ...(q ? { name: { contains: q } } : {}) },
            select: { id: true, name: true, defaultEntryAmount: true },
            orderBy: { name: 'asc' },
            take: limit,
        });
    }
}
