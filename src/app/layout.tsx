import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsProvider } from "@/component/NuqsProvider";
import { ThemeProvider } from "@/component/ThemeProvider";
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
  title: "SchoolSMS — School Management System",
  description: "Premium school management platform for admins, teachers, students, and parents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <NuqsProvider>{children}</NuqsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
