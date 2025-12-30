import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import { BugReportButton } from "../components/BugReportButton";
import { Navbar } from "../components/Navbar";

// const inter = Inter({ subsets: ["latin"] });

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
      {/* <body className={`${inter.className} bg-[#050505] text-zinc-200 min-h-screen selection:bg-white/20`}> */}
      <body className={`bg-[#050505] text-zinc-200 min-h-screen selection:bg-white/20`}>
        <AuthProvider>
            <Navbar />
            {children}
            <BugReportButton />
        </AuthProvider>
      </body>
    </html>
  );
}