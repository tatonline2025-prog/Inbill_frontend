"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const UserDropdown = () => (
    <div className="relative group">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="nav-item flex items-center justify-between w-full md:w-auto gap-2 cursor-pointer text-blue-100 hover:text-white"
      >
        <div className="flex items-center gap-1">
          <span>Tài khoản</span>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${
            userMenuOpen ? "rotate-180" : ""
          } md:group-hover:rotate-180`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`
          transition-all duration-300 overflow-hidden
          ${userMenuOpen ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0 md:opacity-100 md:max-h-none"}
          md:absolute md:hidden md:group-hover:block md:top-full md:left-0 md:mt-0 md:pt-2 md:w-56 z-50
        `}
      >
        <div className="md:bg-white md:rounded-md md:shadow-2xl md:border md:border-gray-200 md:py-1 md:overflow-hidden">
          {user?.role === "admin" && (
            <Link
              href="/users"
              className="block py-2 px-3 md:px-4 text-sm font-medium rounded-md text-white hover:bg-blue-500 md:text-gray-700 md:hover:bg-gray-100 md:hover:text-blue-600 pl-8 md:pl-4 transition border-b border-gray-100 md:border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Quản lý người dùng
            </Link>
          )}

          <Link
            href="/profile"
            className="block py-2 px-3 md:px-4 text-sm font-medium rounded-md text-white hover:bg-blue-500 md:text-gray-700 md:hover:bg-gray-100 md:hover:text-blue-600 pl-8 md:pl-4 transition border-b border-gray-100"
            onClick={() => setIsMenuOpen(false)}
          >
            Thông tin cá nhân
          </Link>

          <Link
            href="/changepass"
            className="block py-2 px-3 md:px-4 text-sm font-medium rounded-md text-white hover:bg-blue-500 md:text-gray-700 md:hover:bg-gray-100 md:hover:text-blue-600 pl-8 md:pl-4 transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Đổi mật khẩu
          </Link>
        </div>
      </div>
    </div>
  );

  const NavLinks = () => (
    <>
      {isAuthenticated ? (
        <>
          <span className="py-2 px-3 font-medium text-blue-100">
            👋 Xin chào, <span className="font-semibold">{user?.fullName}</span>
          </span>

          {user?.role === "admin" && (
            <>
              <Link href="/home" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Trang chủ
              </Link>

              <UserDropdown />

              <Link href="/admin_invoice" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Quản lý hoá đơn
              </Link>
            </>
          )}

          {user?.role !== "admin" && (
            <>
              <Link href="/userhome" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Trang chủ
              </Link>

              <UserDropdown />

              <Link href="/user_invoice" className="nav-item" onClick={() => setIsMenuOpen(false)}>
                Quản lý hoá đơn
              </Link>
            </>
          )}

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
          isMenuOpen ? "max-h-screen opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-4 py-3 space-y-2">
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
