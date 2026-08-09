import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "react-hot-toast";

import { PageContainer } from "@/components/PageContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeuroAI - Brain Tumor Detection",
  description: "Futuristic AI-powered medical dashboard for Brain Tumor Detection & Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white antialiased selection:bg-white/30`}>
        <div className="fixed inset-0 z-[-1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <AuthGuard>
          <FloatingNavbar />
          <PageContainer>
            {children}
          </PageContainer>
        </AuthGuard>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
