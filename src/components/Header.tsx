"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition duration-300">
          In Bill Hoá Đơn TAT
        </Link>
        <div className="space-x-6 flex items-center">
          {isAuthenticated ? (
            <>
              <span>Chào, {user?.fullName}</span>

              {user?.role === "admin" ? <Link href="/users">Tài khoản</Link> : <></>}

              {user?.role === "admin" ? (
                <Link href="/admin_invoice" className="hover:text-blue-200 transition duration-300">
                  Quản lý hoá đơn
                </Link>
              ) : (
                <Link href="/user_invoice" className="hover:text-blue-200 transition duration-300">
                  Quản lý hoá đơn
                </Link>
              )}

              {user?.role === "admin" ? <Link href="/register">Đăng ký tài khoản con</Link> : <></>}

              <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Đăng nhập</Link>
              <Link href="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
