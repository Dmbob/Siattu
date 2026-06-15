import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceEntryScheduleService } from "@/lib/service/InvoiceEntryScheduleService";
import { parseScheduleInput } from "@/lib/models/InvoiceEntrySchedule";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { input, error } = parseScheduleInput(await req.json().catch(() => ({})));
    if (!input) return apiError(error ?? "Invalid schedule.", 400);

    try {
        const schedule = await new InvoiceEntryScheduleService().create(session.user.id, input);
        return apiSuccess({ id: schedule.id }, 201);
    } catch (err) {
        if (err instanceof Error && err.message.includes("not found")) return apiError(err.message, 404);
        console.error(err);
        return apiError("Something went wrong.");
    }
}
