import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NeonAuthProvider } from "@/components/auth/neon-auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NxrthStack | Freelance Software Development",
  description:
    "Professional freelance software development specializing in web applications with Next.js, desktop applications, and game development. Building digital solutions that matter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NeonAuthProvider>{children}</NeonAuthProvider>
      </body>
    </html>
  );
}
