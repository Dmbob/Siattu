import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceGroupService } from "@/lib/service/InvoiceGroupService";
import { parseInvoiceGroupInput } from "@/lib/models/InvoiceGroup";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = await params;
    const { input, error } = parseInvoiceGroupInput(await req.json().catch(() => ({})), { requireCustomer: false });
    if (!input) return apiError(error ?? "Invalid invoice group.", 400);

    try {
        await new InvoiceGroupService().update(session.user.id, id, input);
        return apiSuccess({ ok: true });
    } catch (err) {
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = await params;
    try {
        await new InvoiceGroupService().remove(session.user.id, id);
        return apiSuccess({ ok: true });
    } catch (err) {
        if (err instanceof Error && err.message.includes("in use")) return apiError(err.message, 409);
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
