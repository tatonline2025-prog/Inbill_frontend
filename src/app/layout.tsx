import type { Metadata } from "next";

import Header from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "In Bill - TAT",
  description: "Hệ thống in bill",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">{children}</main>
          <Toaster position="top-center" reverseOrder={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
