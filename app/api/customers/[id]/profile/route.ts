import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { CustomerService } from "@/lib/service/CustomerService";
import { parseCustomerFormData } from "@/lib/models/CustomerFormData";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = await params;
    const { data, valid } = parseCustomerFormData(await req.formData());
    if (!valid) return apiError("All required fields must be provided.", 400);

    try {
        await new CustomerService().updateProfile(session.user.id, id, {
            name: data.name,
            street1: data.street1,
            street2: data.street2 ?? null,
            city: data.city,
            region: data.region,
            postalCode: data.postalCode,
        });
        return apiSuccess({ ok: true });
    } catch (err) {
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
