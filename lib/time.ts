// Helpers for working with time-tracking durations.

const MS_PER_HOUR = 3_600_000;

/** Decimal hours between two instants. */
export function hoursBetween(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / MS_PER_HOUR;
}

/** Format decimal hours for display, e.g. 2.5 -> "2.50 h". */
export function formatHours(hours: number): string {
    return `${hours.toFixed(2)} h`;
}

/** Round decimal hours to the nearest half hour, e.g. 1.2 -> 1.0, 1.4 -> 1.5. */
export function roundToHalfHour(hours: number): number {
    return Math.round(hours * 2) / 2;
}

/**
 * Billable timed quantity: nearest half hour, with a 30-minute (0.5 h) floor so
 * any tracked time under half an hour still bills for half an hour.
 */
export function billableHalfHours(hours: number): number {
    return Math.max(0.5, roundToHalfHour(hours));
}

export interface TimeOption {
    value: string; // "HH:MM" 24-hour
    label: string; // "9:00 AM"
}

/** Half-hour-spaced time-of-day options for the whole day (00:00 .. 23:30). */
export function halfHourOptions(): TimeOption[] {
    const opts: TimeOption[] = [];
    for (let m = 0; m < 24 * 60; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const value = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const ampm = h < 12 ? "AM" : "PM";
        opts.push({ value, label: `${h12}:${String(min).padStart(2, "0")} ${ampm}` });
    }
    return opts;
}
