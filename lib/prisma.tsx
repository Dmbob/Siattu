import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from '@/app/generated/prisma/client'

const prismaClientSingleton = () => {
    var adapter = new PrismaBetterSqlite3({ url: "file:../data.db" });
    return new PrismaClient({ adapter });
}

declare const globalThis: {
  prisma: PrismaClient;
}

export const prisma = (globalThis.prisma ?? prismaClientSingleton())

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma