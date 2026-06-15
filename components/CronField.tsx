"use client";

const CRON_PRESETS = [
    { label: "Monthly (1st, 9am)", value: "0 9 1 * *" },
    { label: "Weekly (Mon, 9am)", value: "0 9 * * 1" },
    { label: "Daily (9am)", value: "0 9 * * *" },
    { label: "Yearly (Jan 1, 9am)", value: "0 9 1 1 *" },
];

interface Props {
    id: string;
    value: string;
    onChange: (v: string) => void;
}

/** A cron-expression input with quick-pick presets. */
export default function CronField({ id, value, onChange }: Props) {
    return (
        <div>
            <input id={id} className="form-control font-monospace" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0 9 1 * *" required />
            <div className="form-text">
                Quick picks:{" "}
                {CRON_PRESETS.map((p, i) => (
                    <span key={p.value}>
                        {i > 0 && " · "}
                        <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => onChange(p.value)}>{p.label}</button>
                    </span>
                ))}
            </div>
        </div>
    );
}
