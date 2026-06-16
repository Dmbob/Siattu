import { formatUSD } from '@/lib/money';
import { entryLineTotal, sumEntryLineTotals } from '@/lib/models/InvoiceEntry';

/** An invoice group row for display in the Invoice Groups tab / typeahead. */
export interface InvoiceGroupListItem {
    id: string;
    name: string;
    invoiceDescription: string;
    entryCount: number;
    scheduleCount: number;
}

/** A lightweight option for the customer-scoped group typeahead. */
export interface InvoiceGroupOption {
    id: string;
    name: string;
    invoiceDescription: string;
}

export interface InvoiceGroupInput {
    customerId: string;
    name: string;
    invoiceDescription: string;
}

/**
 * Validate a JSON body into an InvoiceGroupInput. Pass `requireCustomer: false`
 * for updates, where the owning customer can't change.
 */
export function parseInvoiceGroupInput(
    body: Record<string, unknown>,
    opts: { requireCustomer?: boolean } = {},
): { input: InvoiceGroupInput | null; error?: string } {
    const customerId = typeof body.customerId === 'string' ? body.customerId.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const invoiceDescription = typeof body.invoiceDescription === 'string' ? body.invoiceDescription.trim() : '';

    if ((opts.requireCustomer ?? true) && !customerId) return { input: null, error: 'A customer is required.' };
    if (!name) return { input: null, error: 'A name is required.' };
    if (!invoiceDescription) return { input: null, error: 'An invoice description is required.' };

    return { input: { customerId, name, invoiceDescription } };
}

// --- Invoice rendering: collapsing grouped entries into single lines ---------

/** The minimal entry shape needed to collapse entries into invoice lines. */
export interface GroupableEntry {
    id: string;
    description: string;
    amount: number; // per-unit cents (hourly rate when timed)
    quantity: number;
    date: Date;
    startTime: Date | null;
    invoiceGroupId: string | null;
    invoiceGroupLabel: string | null;
}

/** A single rendered invoice line — either one entry or a collapsed group. */
export interface InvoiceLine {
    key: string;
    description: string;
    quantity: number; // summed for groups
    quantityIsHours: boolean; // format as hours when every underlying entry is timed
    rateDisplay: string; // a single rate, or a "2 @ $10, 1 @ $5" breakdown for mixed groups
    amount: number; // line total in cents (summed for groups)
    dateStart: Date;
    dateEnd: Date; // equals dateStart for single-date lines
    isGroup: boolean;
}

/** Trim a quantity for display: "2" not "2.00", "2.5" not "2.50". */
function formatQuantity(q: number): string {
    return Number.isInteger(q) ? String(q) : String(Number(q.toFixed(2)));
}

/**
 * Render the group rate column. When every entry shares one rate, show it
 * ("$10.00"); when rates differ, show the total quantity billed at each rate
 * ("qty @ rate"), one rate per line, highest first ("1 @ $100.00" / "2.5 @ $5.00").
 * The per-rate quantities sum to the line's Qty just as the per-rate amounts sum
 * to its total. Renderers must honor the embedded newlines (react-pdf does
 * natively; HTML uses pre-line).
 */
export function formatGroupRate(entries: GroupableEntry[]): string {
    const qtyByRate = new Map<number, number>();
    for (const e of entries) qtyByRate.set(e.amount, (qtyByRate.get(e.amount) ?? 0) + e.quantity);
    if (qtyByRate.size === 1) return formatUSD(entries[0].amount);
    return [...qtyByRate.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([rate, qty]) => `${formatQuantity(qty)} @ ${formatUSD(rate)}`)
        .join('\n');
}

/**
 * Collapse a type-section's entries into render-ready lines: entries sharing an
 * `invoiceGroupId` fold into one line (group's snapshot label, summed quantity,
 * summed amount, smart rate), positioned where the group first appears; ungrouped
 * entries pass through unchanged. Input order is preserved (callers sort first).
 */
export function collapseEntriesIntoInvoiceLines(entries: GroupableEntry[]): InvoiceLine[] {
    const lines: InvoiceLine[] = [];
    const groupAt = new Map<string, number>();
    const grouped = new Map<string, GroupableEntry[]>();

    for (const e of entries) {
        if (e.invoiceGroupId) {
            const idx = groupAt.get(e.invoiceGroupId);
            if (idx === undefined) {
                groupAt.set(e.invoiceGroupId, lines.length);
                grouped.set(e.invoiceGroupId, [e]);
                lines.push(groupLine(e.invoiceGroupId, [e]));
            } else {
                const members = grouped.get(e.invoiceGroupId)!;
                members.push(e);
                lines[idx] = groupLine(e.invoiceGroupId, members);
            }
        } else {
            lines.push({
                key: e.id,
                description: e.description,
                quantity: e.quantity,
                quantityIsHours: !!e.startTime,
                rateDisplay: formatUSD(e.amount),
                amount: entryLineTotal(e),
                dateStart: e.date,
                dateEnd: e.date,
                isGroup: false,
            });
        }
    }
    return lines;
}

function groupLine(groupId: string, members: GroupableEntry[]): InvoiceLine {
    const times = members.map((m) => new Date(m.date).getTime());
    return {
        key: `group:${groupId}`,
        description: members[0].invoiceGroupLabel ?? '',
        quantity: members.reduce((sum, m) => sum + m.quantity, 0),
        quantityIsHours: members.every((m) => m.startTime),
        rateDisplay: formatGroupRate(members),
        amount: sumEntryLineTotals(members),
        dateStart: new Date(Math.min(...times)),
        dateEnd: new Date(Math.max(...times)),
        isGroup: true,
    };
}
