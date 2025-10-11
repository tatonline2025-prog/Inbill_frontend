// src/app/page.tsx

import AdminRoute from "@/components/AdminRoute";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-8 text-center bg-gray-50">
      <div className="max-w-4xl p-10 bg-white rounded-xl shadow-2xl">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-4 animate-fadeIn">
          Chào mừng đến với Hệ thống Quản lý của chúng tôi!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Nơi bạn có thể quản lý người dùng và nhập dữ liệu Excel một cách dễ dàng.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Quản lý Tài khoản */}
          <Link
            href="/users"
            className="block p-6 border-2 border-blue-400 rounded-lg shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1 duration-300 bg-blue-50"
          >
            <h2 className="text-2xl font-semibold text-blue-600 mb-2">Quản lý Tài khoản</h2>
            <p className="text-gray-600">Xem, chỉnh sửa, và quản lý danh sách tất cả người dùng.</p>
          </Link>

          {/* Card 3: Đăng ký/Đăng nhập */}
          <div className="p-6 border-2 border-green-400 rounded-lg shadow-md bg-green-50">
            <h2 className="text-2xl font-semibold text-green-600 mb-3">Bắt đầu ngay!</h2>
            <div className="flex justify-center space-x-4">
              <Link
                href="/login"
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition duration-200"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="bg-white text-green-600 border border-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition duration-200"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
