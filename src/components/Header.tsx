"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State để quản lý việc đóng/mở menu mobile

  // Tách JSX của các link ra một component con để tái sử dụng
  const NavLinks = () => (
    <>
      {isAuthenticated ? (
        <>
          <span className="py-2 px-3">Chào, {user?.fullName}</span>

          {user?.role === "admin" && (
            <Link
              href="/users"
              className="block py-2 px-3 rounded hover:bg-blue-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Tài khoản
            </Link>
          )}

          {user?.role === "admin" ? (
            <Link
              href="/admin_invoice"
              className="block py-2 px-3 rounded hover:bg-blue-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Quản lý hoá đơn
            </Link>
          ) : (
            <Link
              href="/user_invoice"
              className="block py-2 px-3 rounded hover:bg-blue-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Quản lý hoá đơn
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              href="/register"
              className="block py-2 px-3 rounded hover:bg-blue-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Đăng ký tài khoản con
            </Link>
          )}

          <button
            onClick={logout}
            className="w-full text-left bg-red-500 py-2 px-3 rounded hover:bg-red-600 md:w-auto md:text-center"
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="block py-2 px-3 rounded hover:bg-blue-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="block py-2 px-3 rounded hover:bg-blue-700"
            onClick={() => setIsMenuOpen(false)}
          >
            Đăng ký
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition duration-300">
          In Bill Hoá Đơn TAT
        </Link>

        {/* === Nút Hamburger cho Mobile === */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              // Icon dấu X khi menu đang mở
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Icon 3 gạch khi menu đang đóng
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>

        {/* === Menu cho Desktop === */}
        <div className="hidden md:flex space-x-6 items-center">
          <NavLinks />
        </div>
      </div>

      {/* === Menu cho Mobile (hiện ra khi click nút hamburger) === */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 flex flex-col space-y-2">
          <NavLinks />
        </div>
      )}
    </nav>
  );
}
