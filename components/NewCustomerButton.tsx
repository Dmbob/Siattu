"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import AddressFields from "@/components/AddressFields";

export default function NewCustomerButton() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/customers", { method: "POST", body: new FormData(e.currentTarget) });
            if (res.ok) {
                setOpen(false);
                router.refresh();
            } else {
                const body = await res.json().catch(() => ({}));
                setError(body.error?.message ?? "Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button type="button" className="btn btn-primary" onClick={() => { setError(null); setOpen(true); }}>
                + New Customer
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="New Customer">
                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    <div className="mb-3">
                        <div className="form-floating">
                            <input id="name" name="name" className="form-control" type="text" placeholder="Customer Name" required />
                            <label htmlFor="name">Customer Name</label>
                        </div>
                    </div>

                    <hr className="my-3" />
                    <h6 className="mb-3 fw-semibold">Address</h6>
                    <AddressFields />

                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving…" : "Create Customer"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
