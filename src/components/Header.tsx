"use client";

import { useState } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const closeMenus = () => {
    setIsMenuOpen(false);
    setUserMenuOpen(false);
  };

  const UserDropdown = () => (
    <div className="relative group">
      <button
        onClick={() => setUserMenuOpen((previous) => !previous)}
        className="nav-item flex w-full cursor-pointer items-center justify-between gap-2 text-blue-100 hover:text-white md:w-auto"
      >
        <span>Tài khoản</span>

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
        className={`overflow-hidden transition-all duration-300 ${
          userMenuOpen ? "mt-2 max-h-40 opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        } md:absolute md:left-0 md:top-full md:z-50 md:mt-0 md:hidden md:w-56 md:pt-2 md:group-hover:block`}
      >
        <div className="md:overflow-hidden md:rounded-md md:border md:border-gray-200 md:bg-white md:py-1 md:shadow-2xl">
          <Link
            href="/profile"
            className="block rounded-md border-b border-gray-100 py-2 pl-8 pr-3 text-sm font-medium text-white transition hover:bg-blue-500 md:px-4 md:pl-4 md:text-gray-700 md:hover:bg-gray-100 md:hover:text-blue-600"
            onClick={closeMenus}
          >
            Thông tin cá nhân
          </Link>

          <Link
            href="/changepass"
            className="block rounded-md py-2 pl-8 pr-3 text-sm font-medium text-white transition hover:bg-blue-500 md:px-4 md:pl-4 md:text-gray-700 md:hover:bg-gray-100 md:hover:text-blue-600"
            onClick={closeMenus}
          >
            Đổi mật khẩu
          </Link>
        </div>
      </div>
    </div>
  );

  const AdminLinks = () => (
    <>
      <Link href="/home" className="nav-item" onClick={closeMenus}>
        Trang chủ
      </Link>
      <Link href="/users" className="nav-item" onClick={closeMenus}>
        Người dùng
      </Link>
      <Link href="/area-config" className="nav-item" onClick={closeMenus}>
        Mã Vùng
      </Link>
      <UserDropdown />
      <Link href="/all-invoices" className="nav-item" onClick={closeMenus}>
        DS Tổng
      </Link>
      <Link href="/admin_invoice" className="nav-item" onClick={closeMenus}>
        QL Hóa Đơn
      </Link>
    </>
  );

  const UserLinks = () => (
    <>
      <Link href="/userhome" className="nav-item" onClick={closeMenus}>
        Trang chủ
      </Link>
      <UserDropdown />
      <Link href="/user_invoice_v2" className="nav-item" onClick={closeMenus}>
        QL Hóa Đơn
      </Link>
    </>
  );

  const NavLinks = () => (
    <>
      {isAuthenticated ? (
        <>
          <span className="px-2 py-2 text-sm font-medium text-blue-100 md:mr-1 md:text-base">
            Xin Chào <span className="font-semibold">{user?.fullName || "TAT"}</span> ! $$$
          </span>

          {user?.role === "admin" ? <AdminLinks /> : <UserLinks />}

          <button
            onClick={() => {
              logout();
              closeMenus();
            }}
            className="mt-2 rounded-md bg-red-500 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-red-600 md:mt-0"
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <Link href="/login" className="nav-item" onClick={closeMenus}>
          Đăng nhập
        </Link>
      )}
    </>
  );

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <Link
          href="/"
          className="max-w-[calc(100%-3.5rem)] text-lg font-bold leading-tight tracking-wide transition duration-300 hover:text-blue-200 sm:text-xl lg:text-2xl"
        >
          In Bill - TAT
        </Link>

        <button className="md:hidden focus:outline-none" onClick={() => setIsMenuOpen((previous) => !previous)}>
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

        <nav className="hidden min-w-0 md:ml-auto md:flex md:flex-wrap md:items-center md:justify-start md:gap-2 lg:gap-3">
          <NavLinks />
        </nav>
      </div>

      <div
        className={`overflow-hidden bg-blue-700 transition-all duration-300 md:hidden ${
          isMenuOpen ? "max-h-screen overflow-y-auto opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col space-y-2 px-3 py-3 sm:px-4">
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
