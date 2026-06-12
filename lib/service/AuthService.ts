import { ServiceProviderService } from "./ServiceProviderService";
import bcrypt from 'bcrypt';

export class AuthService {
    private _sps: ServiceProviderService;

    constructor(sps: ServiceProviderService) {
        this._sps = sps;
    }

    public static async getPwHash(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    public async login(username: string, password: string): Promise<boolean> {
        const pwHash = await AuthService.getPwHash(password);

        const user = await this._sps.getByUsername(username);

        if (!user) return false;

        if (user.password !== pwHash) return false;
            
        return true;
    }
}