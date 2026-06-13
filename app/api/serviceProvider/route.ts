import { ServiceProviderService } from "@/lib/service/ServiceProviderService";

export async function GET() {
    const sps = new ServiceProviderService();

    const data = await sps.list(0, 10);

    return Response.json(data);
}