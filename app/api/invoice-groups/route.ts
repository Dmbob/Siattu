import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceGroupService } from "@/lib/service/InvoiceGroupService";
import { parseInvoiceGroupInput } from "@/lib/models/InvoiceGroup";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const customerId = req.nextUrl.searchParams.get("customerId")?.trim() ?? "";
    if (!customerId) return apiError("A customer is required.", 400);
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

    const groups = await new InvoiceGroupService().search(session.user.id, customerId, q);
    return apiSuccess(groups);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { input, error } = parseInvoiceGroupInput(await req.json().catch(() => ({})));
    if (!input) return apiError(error ?? "Invalid invoice group.", 400);

    try {
        const group = await new InvoiceGroupService().create(session.user.id, input);
        return apiSuccess({ id: group.id }, 201);
    } catch (err) {
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
