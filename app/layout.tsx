import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import { BugReportButton } from "../components/BugReportButton";
import { Navbar } from "../components/Navbar";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoLabDocs",
  description: "Documentation Reimagined",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#050505] text-zinc-200 min-h-screen selection:bg-blue-500/20 antialiased`}>
        <AuthProvider>
            <Navbar />
            {children}
            <Analytics />
            <BugReportButton />
        </AuthProvider>
      </body>
    </html>
  );
}