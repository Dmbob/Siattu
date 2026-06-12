import { TimeEntry } from '@/app/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export class TimeEntryService implements Service<TimeEntry> {
    async get(id: string): Promise<TimeEntry | null> {
        return await prisma.timeEntry.findFirst({where: { id }});
    }
    async upsert(obj: TimeEntry): Promise<TimeEntry> {
        return await prisma.timeEntry.upsert({where: {id: obj.id}, create: obj, update: obj});
    }
    async delete(id: string): Promise<TimeEntry> {
        return await prisma.timeEntry.delete({where: { id }});
    }
    async list(offset: number, pageSize: number): Promise<TimeEntry[]> {
        return await prisma.timeEntry.findMany({skip: offset, take: pageSize});
    }
}