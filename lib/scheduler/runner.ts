import { schedule as scheduleCron } from 'node-cron';
import { InvoiceEntryScheduleService } from '@/lib/service/InvoiceEntryScheduleService';

// Guard on globalThis so HMR / repeated module evaluation can't start the
// minute-ticker more than once (same pattern as the Prisma singleton).
const g = globalThis as unknown as { __siattuSchedulerStarted?: boolean };

/** Start the in-process scheduler: every minute, fire any due schedules. */
export function startScheduler(): void {
    if (g.__siattuSchedulerStarted) return;
    g.__siattuSchedulerStarted = true;

    scheduleCron('* * * * *', async () => {
        try {
            const created = await new InvoiceEntryScheduleService().runDue(new Date());
            if (created > 0) {
                console.log(`[scheduler] created ${created} scheduled entr${created === 1 ? 'y' : 'ies'}`);
            }
        } catch (err) {
            console.error('[scheduler] tick failed', err);
        }
    });

    console.log('[scheduler] started — checking schedules every minute');
}
