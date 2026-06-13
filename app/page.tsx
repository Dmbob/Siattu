"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ServiceProvider } from "./generated/prisma/client";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const data = fetch('/api/serviceProvider')
      .then(r => r.json())
      .then(data => {
        console.log("Data", data);
        if (data === null || data === undefined || data.length === 0) {
          router.push('/setup');
          return;
        }

        router.push('/api/auth/signin');
      });
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return null;
  }

  return (
    <main style={{ padding: "2rem" }}>
      <p>Welcome back, <strong>{session.user?.name}</strong>!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </main>
  );

}