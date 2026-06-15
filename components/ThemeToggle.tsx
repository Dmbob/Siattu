"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Light/dark toggle. The pre-paint script in app/layout.tsx has already set
 * `data-bs-theme` on <html> (system-aware, or from localStorage); here we just
 * read it after mount, flip it on click, and persist the choice.
 */
export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const current = document.documentElement.getAttribute("data-bs-theme");
        setTheme(current === "dark" ? "dark" : "light");
        setMounted(true);
    }, []);

    function toggle() {
        const next: Theme = theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-bs-theme", next);
        try { localStorage.setItem("theme", next); } catch { /* private mode */ }
        setTheme(next);
    }

    const dark = theme === "dark";
    return (
        <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            // Avoid a hydration mismatch flash: keep the icon hidden until mounted.
            style={{ minWidth: "2.25rem" }}
        >
            <span aria-hidden>{mounted ? (dark ? "☀️" : "🌙") : ""}</span>
        </button>
    );
}
