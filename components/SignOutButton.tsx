"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
    return (
        <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => signOut({ callbackUrl: "/signin" })}
        >
            Sign Out
        </button>
    );
}
