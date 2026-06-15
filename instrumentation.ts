// Next.js calls register() once per server instance on startup. We start the
// in-process recurring-entry scheduler here, only on the Node.js runtime.
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { startScheduler } = await import('@/lib/scheduler/runner');
        startScheduler();
    }
}
