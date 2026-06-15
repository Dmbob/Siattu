"use client";

import { useEffect } from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "lg" | "xl";
}

/**
 * A reusable Bootstrap modal whose visibility is driven by React state (rather
 * than Bootstrap's JS), so it composes cleanly with the rest of the app.
 */
export default function Modal({ open, onClose, title, children, footer, size }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.classList.add("modal-open");
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.classList.remove("modal-open");
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            <div className="modal fade show d-block" role="dialog" tabIndex={-1} onClick={onClose}>
                <div
                    className={`modal-dialog modal-dialog-centered${size ? ` modal-${size}` : ""}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-semibold">{title}</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
                        </div>
                        <div className="modal-body">{children}</div>
                        {footer && <div className="modal-footer">{footer}</div>}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
}
