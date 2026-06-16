"use client";

import { useState, useEffect, useRef } from "react";
import type { InvoiceGroupOption } from "@/lib/models/InvoiceGroup";

interface Props {
    customerId: string | null;
    selectedName?: string;
    onSelect: (group: InvoiceGroupOption | null) => void;
}

/**
 * Customer-scoped group picker. Mirrors CustomerTypeahead (open on focus, debounced
 * search, click-away close) but lists only the selected customer's groups and offers
 * a "no group" choice since the field is optional. Disabled until a customer is set.
 */
export default function InvoiceGroupTypeahead({ customerId, selectedName, onSelect }: Props) {
    const [query, setQuery] = useState(selectedName ?? "");
    const [results, setResults] = useState<InvoiceGroupOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    useEffect(() => {
        if (!open || !customerId) return;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/invoice-groups?customerId=${encodeURIComponent(customerId)}&q=${encodeURIComponent(query)}`);
                const body = await res.json();
                setResults(res.ok ? (body.data ?? []) : []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 200);
        return () => clearTimeout(t);
    }, [query, open, customerId]);

    function select(g: InvoiceGroupOption | null) {
        setQuery(g ? g.name : "");
        onSelect(g);
        setOpen(false);
    }

    if (!customerId) {
        return <input className="form-control" placeholder="Select a customer first" disabled />;
    }

    return (
        <div className="position-relative" ref={boxRef}>
            <input
                className="form-control"
                type="text"
                placeholder="Search groups…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                autoComplete="off"
            />
            {open && (
                <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1060, maxHeight: 220, overflowY: "auto" }}>
                    <button type="button" className="list-group-item list-group-item-action text-muted fst-italic" onClick={() => select(null)}>
                        — No group —
                    </button>
                    {loading && <span className="list-group-item text-muted small">Searching…</span>}
                    {!loading && results.length === 0 && <span className="list-group-item text-muted small">No groups found.</span>}
                    {results.map((g) => (
                        <button key={g.id} type="button" className="list-group-item list-group-item-action" onClick={() => select(g)}>
                            {g.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
