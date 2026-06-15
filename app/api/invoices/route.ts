import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceService } from "@/lib/service/InvoiceService";
import { apiSuccess, apiError } from "@/lib/api/response";

function parseDateOnly(v: unknown): Date | null {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(`${v}T12:00:00.000Z`); // noon UTC avoids local-tz date drift
    return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const customerId = typeof body.customerId === "string" ? body.customerId : "";
    const entryIds = Array.isArray(body.entryIds) ? body.entryIds.filter((x: unknown) => typeof x === "string") : [];
    const date = parseDateOnly(body.date);

    if (!customerId) return apiError("A customer is required.", 400);
    if (entryIds.length === 0) return apiError("Select at least one entry to invoice.", 400);
    if (!date) return apiError("A valid invoice date is required.", 400);

    try {
        const invoice = await new InvoiceService().createFromEntries(session.user.id, customerId, entryIds, date);
        return apiSuccess({ id: invoice.id }, 201);
    } catch (err) {
        if (err instanceof Error && (err.message.includes("no longer available") || err.message.includes("running timer"))) {
            return apiError(err.message, 409);
        }
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
