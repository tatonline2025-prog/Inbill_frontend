"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      {isAuthenticated ? (
        <>
          <span className="py-2 px-3 font-medium text-blue-100">
            👋 Xin chào, <span className="font-semibold">{user?.fullName}</span>
          </span>

          {user?.role === "admin" && (
            <>
              <Link href="/users" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Tài khoản
              </Link>

              <Link href="/admin_invoice" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Quản lý hoá đơn
              </Link>

              <Link href="/register" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Đăng ký tài khoản con
              </Link>

              <Link href="/dashboard" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Thống kê
              </Link>

              <Link href="/optimalsumfinder" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Tool tính toán
              </Link>
            </>
          )}

          {user?.usertype === "collaborator" && (
            <>
              <Link href="/optimalsumfinder" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Tool tính toán
              </Link>
            </>
          )}

          {user?.role !== "admin" && user?.usertype !== "collaborator" && (
            <>
              <Link href="/user_invoice" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Quản lý hoá đơn
              </Link>

              <Link href="/userdashboard" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Thống kê
              </Link>

              <Link href="/optimalsumfinder" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Tool tính toán
              </Link>
            </>
          )}

          {/* Đổi mật khẩu cho tất cả user */}
          <Link href="/changepass" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            Đổi mật khẩu
          </Link>

          {/* Đăng xuất */}
          <button
            onClick={() => {
              logout();
              setIsMenuOpen(false);
            }}
            className="mt-2 md:mt-0 bg-red-500 hover:bg-red-600 transition px-4 py-2 rounded-md text-white font-medium shadow-sm"
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            Đăng nhập
          </Link>
          <Link href="/register" className="nav-item" onClick={() => setIsMenuOpen(false)}>
            Đăng ký
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-wide hover:text-blue-200 transition duration-300">
          In Bill Hoá Đơn TAT
        </Link>

        {/* Nút menu (mobile) */}
        <button className="md:hidden focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center space-x-4">
          <NavLinks />
        </nav>
      </div>

      {/* Menu mobile (có animation trượt xuống) */}
      <div
        className={`md:hidden bg-blue-700 transition-all duration-300 overflow-hidden ${
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-4 py-3 space-y-2">
          <NavLinks />
        </div>
      </div>
    </header>
  );
}

/* 💅 Tailwind helper class */
const style = `
.nav-item {
  @apply block py-2 px-3 rounded-md hover:bg-blue-500 hover:text-white transition text-sm font-medium;
}
`;
