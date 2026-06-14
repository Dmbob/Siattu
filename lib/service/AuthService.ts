import { ServiceProvider } from "@/app/generated/prisma/client";
import { ServiceProviderService } from "./ServiceProviderService";
import bcrypt from 'bcrypt';

type LoginUser = Pick<ServiceProvider, "id" | "username" | "firstName" | "lastName">;

export class AuthService {
    private _sps: ServiceProviderService;

    constructor(sps: ServiceProviderService) {
        this._sps = sps;
    }

    public static async getPwHash(password: string): Promise<string> {
        if (password === undefined) return "";
        return await bcrypt.hash(password, 10);
    }

    public async login(username: string, password: string): Promise<LoginUser | null> {
        const user = await this._sps.getByUsername(username, {id: true, username: true, firstName: true, lastName: true, password: true});

        if (!user) return null;

        if (!await bcrypt.compare(password, user.password)) return null;

        return { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName };
    }
}