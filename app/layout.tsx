import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// Bootstrap first, then globals.css so our theme overrides win the cascade.
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
import { AuthProvider } from "./api/auth/[...nextauth]/AuthProvider";
import { auth } from "@/auth";
import Nav from "@/components/Nav";
import { TimeTrackingService } from "@/lib/service/TimeTrackingService";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Siattu",
  description: "Simple Invoicing And Time Tracking Utility",
};

// Applied before paint to avoid a light/dark flash: use the saved choice, else
// follow the OS preference (the "follow system" default).
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-bs-theme',t);}catch(e){document.documentElement.setAttribute('data-bs-theme','light');}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const openTimer = session ? await new TimeTrackingService().getOpen() : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-vh-100">
        <AuthProvider>
          {session && (
            <Nav
              userName={session.user?.name ?? ""}
              openTimer={openTimer ? { customerName: openTimer.customerName, startTime: openTimer.startTime.toISOString() } : null}
            />
          )}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
