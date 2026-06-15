// Money is stored everywhere as integer cents. These helpers convert at the
// display/input boundary so the rest of the app never deals with floats.

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Format a cents amount as a USD string, e.g. 123456 -> "$1,234.56". */
export function formatUSD(cents: number): string {
    return usd.format(cents / 100);
}

/** Convert a dollar amount (number or string) to integer cents. */
export function dollarsToCents(dollars: number | string): number {
    const n = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
    return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

/** Convert integer cents to a dollar number (for form inputs). */
export function centsToDollars(cents: number): number {
    return cents / 100;
}
