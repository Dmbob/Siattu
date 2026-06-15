import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { CustomerService } from "@/lib/service/CustomerService";
import { parseCustomerFormData } from "@/lib/models/CustomerFormData";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const customers = await new CustomerService().search(session.user.id, q);
    return apiSuccess(customers);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    const serviceProviderId = session?.user?.id;
    if (!serviceProviderId) return apiError("Unauthorized", 401);

    const { data, valid } = parseCustomerFormData(await req.formData());
    if (!valid) return apiError("All required fields must be provided.", 400);

    try {
        const customer = await new CustomerService().createWithAddress({
            name: data.name,
            street1: data.street1,
            street2: data.street2 || null,
            city: data.city,
            region: data.region,
            postalCode: data.postalCode,
            serviceProviderId,
        });
        return apiSuccess({ id: customer.id }, 201);
    } catch (err) {
        console.error(err);
        return apiError("Something went wrong.");
    }
}
