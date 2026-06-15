import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceEntryService } from "@/lib/service/InvoiceEntryService";
import { parseInvoiceEntryInput } from "@/lib/models/InvoiceEntry";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { input, error } = parseInvoiceEntryInput(await req.json().catch(() => ({})));
    if (!input) return apiError(error ?? "Invalid entry.", 400);

    try {
        const entry = await new InvoiceEntryService().createEntry(input);
        return apiSuccess({ id: entry.id }, 201);
    } catch (err) {
        if (err instanceof Error && err.message.includes("already running")) return apiError(err.message, 409);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
