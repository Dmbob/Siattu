"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import TimeTrackModal from "@/components/TimeTrackModal";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
    { href: "/", label: "Home" },
    { href: "/customers", label: "Customers" },
    { href: "/invoice-entries", label: "Invoice Entries" },
    { href: "/invoices", label: "Invoices" },
];

interface NavProps {
    userName: string;
    openTimer: { customerName: string; startTime: string } | null;
}

export default function Nav({ userName, openTimer }: NavProps) {
    const pathname = usePathname();
    const [navOpen, setNavOpen] = useState(false);
    const [trackOpen, setTrackOpen] = useState(false);
    const tracking = !!openTimer;

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);

    return (
        <>
            {/* navbar-expand-lg: links inline on desktop (lg+), behind the hamburger
                below lg. The collapse is toggled with React state (no Bootstrap JS). */}
            <nav className="navbar navbar-expand-lg app-navbar sticky-top">
                <div className="container-fluid gap-2">
                    <Link href="/" className="navbar-brand fw-bold me-1" onClick={() => setNavOpen(false)}>
                        Siattu
                    </Link>

                    {/* Always-visible right cluster (stays in the bar at every width) */}
                    <div className="d-flex align-items-center gap-2 gap-lg-3 ms-auto order-lg-3">
                        <button
                            type="button"
                            className={`btn btn-sm d-none d-lg-inline-flex align-items-center gap-1 ${tracking ? "btn-warning" : "btn-outline-secondary"}`}
                            onClick={() => setTrackOpen(true)}
                        >
                            <span aria-hidden>⏱</span> {tracking ? "Timer Running" : "Track Time"}
                        </button>
                        <ThemeToggle />
                        <span className="navbar-text small d-none d-sm-inline text-body-secondary">
                            Signed in as <span className="fw-semibold text-body">{userName || "User"}</span>
                        </span>
                        <SignOutButton />
                    </div>

                    {/* Hamburger — only shown below lg (Bootstrap hides it at lg+) */}
                    <button
                        type="button"
                        className="navbar-toggler"
                        aria-label="Toggle navigation"
                        aria-expanded={navOpen}
                        onClick={() => setNavOpen((o) => !o)}
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    {/* Page links: inline on desktop, collapsible below lg */}
                    <div className={`collapse navbar-collapse order-lg-2${navOpen ? " show" : ""}`}>
                        <ul className="navbar-nav me-auto my-2 my-lg-0">
                            {LINKS.map(({ href, label }) => (
                                <li className="nav-item" key={href}>
                                    <Link
                                        href={href}
                                        className={`nav-link${isActive(href) ? " active fw-semibold" : ""}`}
                                        aria-current={isActive(href) ? "page" : undefined}
                                        onClick={() => setNavOpen(false)}
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Floating quick action (mobile & tablet) */}
            <button
                type="button"
                className={`btn rounded-circle shadow d-flex d-lg-none align-items-center justify-content-center position-fixed bottom-0 end-0 m-4 ${tracking ? "btn-warning" : "btn-primary"}`}
                style={{ width: 56, height: 56, fontSize: "1.5rem", zIndex: 1030 }}
                aria-label={tracking ? "Time tracking in progress" : "Start time tracking"}
                onClick={() => setTrackOpen(true)}
            >
                ⏱
            </button>

            <TimeTrackModal open={trackOpen} onClose={() => setTrackOpen(false)} openTimer={openTimer} />
        </>
    );
}
