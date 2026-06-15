import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceEntryScheduleService } from "@/lib/service/InvoiceEntryScheduleService";
import { parseScheduleInput } from "@/lib/models/InvoiceEntrySchedule";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = await params;
    const { input, error } = parseScheduleInput(await req.json().catch(() => ({})), { requireCustomer: false });
    if (!input) return apiError(error ?? "Invalid schedule.", 400);

    try {
        await new InvoiceEntryScheduleService().update(session.user.id, id, input);
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
        await new InvoiceEntryScheduleService().remove(session.user.id, id);
        return apiSuccess({ ok: true });
    } catch (err) {
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
