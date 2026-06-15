"use client";

import { useState, useEffect, useRef } from "react";

type Customer = { id: string; name: string; defaultEntryAmount: number };

interface Props {
    onSelect: (customer: Customer) => void;
    selectedName?: string;
}

export default function CustomerTypeahead({ onSelect, selectedName }: Props) {
    const [query, setQuery] = useState(selectedName ?? "");
    const [results, setResults] = useState<Customer[]>([]);
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
        if (!open) return;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/customers?q=${encodeURIComponent(query)}`);
                const body = await res.json();
                setResults(res.ok ? (body.data ?? []) : []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 200);
        return () => clearTimeout(t);
    }, [query, open]);

    function select(c: Customer) {
        setQuery(c.name);
        onSelect(c);
        setOpen(false);
    }

    return (
        <div className="position-relative" ref={boxRef}>
            <input
                className="form-control"
                type="text"
                placeholder="Search customers…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                autoComplete="off"
            />
            {open && (
                <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1060, maxHeight: 220, overflowY: "auto" }}>
                    {loading && <span className="list-group-item text-muted small">Searching…</span>}
                    {!loading && results.length === 0 && <span className="list-group-item text-muted small">No customers found.</span>}
                    {results.map((c) => (
                        <button key={c.id} type="button" className="list-group-item list-group-item-action" onClick={() => select(c)}>
                            {c.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
