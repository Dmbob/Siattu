"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import AddressFields from "@/components/AddressFields";

interface Props {
    customerId: string;
    name: string;
    address: { street1: string; street2: string | null; city: string; region: string; postalCode: string };
}

/** Edit a customer's name and address from the detail page. */
export default function EditCustomerButton({ customerId, name, address }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`/api/customers/${customerId}/profile`, {
                method: "PATCH",
                body: new FormData(e.currentTarget),
            });
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
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setError(null); setOpen(true); }}>
                Edit
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Edit Customer">
                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    <div className="mb-3">
                        <div className="form-floating">
                            <input id="edit-name" name="name" className="form-control" type="text" placeholder="Customer Name" defaultValue={name} required />
                            <label htmlFor="edit-name">Customer Name</label>
                        </div>
                    </div>

                    <hr className="my-3" />
                    <h6 className="mb-3 fw-semibold">Address</h6>
                    <AddressFields defaults={address} />

                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
