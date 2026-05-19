// src/app/layout.tsx
import Header from "@/components/Header";
import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "All Bill - TAT",
  description: "Hệ thống in bill",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {/* Nếu bạn dùng context thì bọc Header + main */}

        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">{children}</main>
          <Toaster position="top-center" reverseOrder={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
