import { auth } from "@/auth";
import { TimeTrackingService } from "@/lib/service/TimeTrackingService";
import { apiSuccess, apiError } from "@/lib/api/response";

// Stop the currently running timer.
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    try {
        const entry = await new TimeTrackingService().stop();
        return apiSuccess({ stopped: !!entry });
    } catch (err) {
        console.error(err);
        return apiError("Something went wrong.");
    }
}
