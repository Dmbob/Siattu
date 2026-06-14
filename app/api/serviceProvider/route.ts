import { ServiceProviderService } from "@/lib/service/ServiceProviderService";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
    try {
        const sps = new ServiceProviderService();
        const list = await sps.list(0, 10);

        return apiSuccess({ hasServiceProviders: (list.length > 0) });
    } catch {
        return apiError("Something went wrong", 500);
    }
}