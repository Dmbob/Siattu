import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { CustomerService } from "@/lib/service/CustomerService";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const startingInvoiceNumber = Number(body.startingInvoiceNumber);
    const defaultEntryAmount = Number(body.defaultEntryAmount);

    if (!Number.isInteger(startingInvoiceNumber) || startingInvoiceNumber < 1) {
        return apiError("Starting invoice number must be a positive integer.", 400);
    }
    if (!Number.isInteger(defaultEntryAmount) || defaultEntryAmount < 0) {
        return apiError("Default rate must be a non-negative amount.", 400);
    }

    try {
        await new CustomerService().updateSettings(id, { startingInvoiceNumber, defaultEntryAmount });
        return apiSuccess({ ok: true });
    } catch (err) {
        console.error(err);
        return apiError("Something went wrong.");
    }
}
