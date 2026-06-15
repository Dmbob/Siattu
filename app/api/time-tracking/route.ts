import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { TimeTrackingService } from "@/lib/service/TimeTrackingService";
import { apiSuccess, apiError } from "@/lib/api/response";

// Start a timer (creates an open entry).
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const customerId = typeof body.customerId === "string" ? body.customerId.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!customerId) return apiError("A customer is required.", 400);

    try {
        const entry = await new TimeTrackingService().start(session.user.id, customerId, description);
        return apiSuccess({ id: entry.id }, 201);
    } catch (err) {
        if (err instanceof Error && err.message.includes("already running")) {
            return apiError(err.message, 409);
        }
        if (err instanceof Error && err.message.includes("not found")) {
            return apiError(err.message, 404);
        }
        console.error(err);
        return apiError("Something went wrong.");
    }
}
