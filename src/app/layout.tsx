// src/app/layout.tsx
import Header from "@/components/Header";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js App with TypeScript",
  description: "Giao diện web cơ bản",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Nếu bạn dùng context thì bọc Header + main */}
        <AuthProvider>
          <Header />
          <main className="container mx-auto p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
