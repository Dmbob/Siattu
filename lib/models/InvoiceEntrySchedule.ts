import { validate as isValidCron } from 'node-cron';

/** A schedule row for display in the Scheduled Entries tab. */
export interface ScheduleListItem {
    id: string;
    description: string;
    type: string;
    quantity: number;
    amount: number; // per-unit cents
    cron: string;
    active: boolean;
    lastRunAt: Date | null;
    createdAt: Date;
}

export interface ScheduleInput {
    customerId: string;
    description: string;
    type: string;
    quantity: number;
    amount: number; // per-unit cents
    cron: string;
    active: boolean;
}

const TYPES = ['bill', 'software'];

/**
 * Validate a JSON body into a ScheduleInput. A schedule is a non-timed entry
 * template (`amount` × `quantity`) plus a cron expression. Pass
 * `requireCustomer: false` for updates, where the customer can't change.
 */
export function parseScheduleInput(
    body: Record<string, unknown>,
    opts: { requireCustomer?: boolean } = {},
): { input: ScheduleInput | null; error?: string } {
    const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const type = typeof body.type === 'string' ? body.type : 'bill';
    const quantity = Number(body.quantity);
    const amount = Number(body.amount);
    const cron = typeof body.cron === 'string' ? body.cron.trim() : '';
    const active = body.active === undefined ? true : body.active === true;

    if ((opts.requireCustomer ?? true) && !customerId) return { input: null, error: 'A customer is required.' };
    if (!description) return { input: null, error: 'A description is required.' };
    if (!TYPES.includes(type)) return { input: null, error: 'Invalid entry type.' };
    if (!Number.isFinite(quantity) || quantity < 0) return { input: null, error: 'Quantity must be a non-negative number.' };
    if (!Number.isInteger(amount) || amount < 0) return { input: null, error: 'Amount must be a non-negative number of cents.' };
    if (!isValidCron(cron)) return { input: null, error: 'Enter a valid cron expression (e.g. "0 9 1 * *").' };

    return { input: { customerId, description, type, quantity, amount, cron, active } };
}
