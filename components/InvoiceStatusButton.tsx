"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    invoiceId: string;
    status: string;
}

/** Toggles an invoice between open (unpaid) and paid. */
export default function InvoiceStatusButton({ invoiceId, status }: Props) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const isPaid = status === "paid";

    async function toggle() {
        setBusy(true);
        try {
            const res = await fetch(`/api/invoices/${invoiceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: isPaid ? "open" : "paid" }),
            });
            if (res.ok) router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <button
            type="button"
            className={`btn btn-sm ${isPaid ? "btn-outline-secondary" : "btn-success"}`}
            onClick={toggle}
            disabled={busy}
        >
            {busy ? "Saving…" : isPaid ? "Mark Unpaid" : "Mark Paid"}
        </button>
    );
}
