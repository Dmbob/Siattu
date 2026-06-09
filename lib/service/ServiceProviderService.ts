import { ServiceProvider } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

class ServiceProviderService implements Service<ServiceProvider> {
    async get(id: string): Promise<ServiceProvider | null> {
        return await prisma.serviceProvider.findFirst({where: { id }});
    }
    async upsert(obj: ServiceProvider): Promise<ServiceProvider> {
        return await prisma.serviceProvider.upsert({where: {id: obj.id}, create: obj, update: obj});
    }
    async delete(id: string): Promise<ServiceProvider> {
        return await prisma.serviceProvider.delete({where: { id }});
    }
    async list(offset: number, pageSize: number): Promise<ServiceProvider[]> {
        return await prisma.serviceProvider.findMany({skip: offset, take: pageSize});
    }
}