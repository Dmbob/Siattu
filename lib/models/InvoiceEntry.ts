export interface InvoiceEntryListItem {
    id: string;
    description: string;
    type: string;
    quantity: number;
    amount: number; // hourly rate (cents/hr) when timed, otherwise the line total (cents)
    billed: boolean;
    date: Date;
    startTime: Date | null;
    endTime: Date | null;
    createdAt: Date;
    customer: { id: string; name: string; defaultEntryAmount: number };
}

export interface InvoiceEntryInput {
    customerId: string;
    description: string;
    type: string;
    date: Date;
    quantity: number;
    amount: number; // hourly rate when timed, otherwise the line total
    startTime: Date | null;
    endTime: Date | null;
}

/**
 * Billable line total in cents. `amount` is always per-unit — an hourly rate for
 * timed entries (× hours) or a unit price for non-timed entries (× quantity).
 */
export function entryLineTotal(e: { amount: number; quantity: number }): number {
    return Math.round(e.amount * e.quantity);
}

/** Sum (cents) of the billable line total across a set of entries. */
export function sumEntryLineTotals(entries: { amount: number; quantity: number }[]): number {
    return entries.reduce((total, e) => total + entryLineTotal(e), 0);
}

const TYPES = ['bill', 'software'];

function parseDateOnly(v: unknown): Date | null {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(`${v}T12:00:00.000Z`); // noon UTC avoids local-tz date drift
    return isNaN(d.getTime()) ? null : d;
}
function parseDateTime(v: unknown): Date | null {
    if (typeof v !== 'string' || !v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Validate a JSON body into an InvoiceEntryInput. When `trackTime` is set the
 * entry is timed: `amount` is the hourly rate, a start time is required, and the
 * end time is optional (omit it to start a running timer).
 */
export function parseInvoiceEntryInput(
    body: Record<string, unknown>,
): { input: InvoiceEntryInput | null; error?: string } {
    const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const type = typeof body.type === 'string' ? body.type : 'bill';
    const date = parseDateOnly(body.date);

    if (!customerId) return { input: null, error: 'A customer is required.' };
    if (!description) return { input: null, error: 'A description is required.' };
    if (!TYPES.includes(type)) return { input: null, error: 'Invalid entry type.' };
    if (!date) return { input: null, error: 'A date is required.' };

    if (body.trackTime === true) {
        const startTime = parseDateTime(body.startTime);
        if (!startTime) return { input: null, error: 'A start time is required for time tracking.' };
        const endTime = parseDateTime(body.endTime);
        if (endTime && endTime <= startTime) return { input: null, error: 'End time must be after start time.' };
        const rate = Number(body.amount);
        if (!Number.isInteger(rate) || rate < 0) return { input: null, error: 'Hourly rate must be a non-negative number of cents.' };
        return { input: { customerId, description, type, date, quantity: 0, amount: rate, startTime, endTime } };
    }

    const quantity = Number(body.quantity);
    const amount = Number(body.amount);
    if (!Number.isFinite(quantity) || quantity < 0) return { input: null, error: 'Quantity must be a non-negative number.' };
    if (!Number.isInteger(amount) || amount < 0) return { input: null, error: 'Amount must be a non-negative number of cents.' };
    return { input: { customerId, description, type, date, quantity, amount, startTime: null, endTime: null } };
}
