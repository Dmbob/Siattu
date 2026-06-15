import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceService } from "@/lib/service/InvoiceService";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const status = body.status;
    if (status !== "open" && status !== "paid") return apiError("Status must be 'open' or 'paid'.", 400);

    try {
        await new InvoiceService().setStatus(session.user.id, id, status);
        return apiSuccess({ ok: true });
    } catch (err) {
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
