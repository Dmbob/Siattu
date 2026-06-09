import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    var adapter = new PrismaBetterSqlite3({ url: "file:./prisma/data.db" });
    return new PrismaClient({ adapter });
}

declare const globalThis: {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma