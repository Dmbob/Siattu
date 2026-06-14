"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      fetch('/api/serviceProvider')
      .then(r => r.json())
      .then(data => {
        if (!data.data?.hasServiceProviders) {
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