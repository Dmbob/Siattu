import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceEntryService } from "@/lib/service/InvoiceEntryService";
import { parseInvoiceEntryInput } from "@/lib/models/InvoiceEntry";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = await params;
    const { input, error } = parseInvoiceEntryInput(await req.json().catch(() => ({})));
    if (!input) return apiError(error ?? "Invalid entry.", 400);

    try {
        await new InvoiceEntryService().updateEntry(id, input);
        return apiSuccess({ ok: true });
    } catch (err) {
        if (err instanceof Error && (err.message.includes("already running") || err.message.includes("billed entry"))) {
            return apiError(err.message, 409);
        }
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
        await new InvoiceEntryService().deleteEntry(id);
        return apiSuccess({ ok: true });
    } catch (err) {
        if (err instanceof Error && err.message.includes("billed entry")) return apiError(err.message, 409);
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
