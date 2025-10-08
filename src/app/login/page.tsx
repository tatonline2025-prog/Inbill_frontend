// frontend/src/app/login/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth.api";

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_URL) return setMessage({ type: "error", text: "Lỗi cấu hình API." });

    try {
      const res = await login(userName, password);

      console.log(res);

      // **LƯU TOKEN VÀO LOCAL STORAGE (hoặc Cookie)**
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage({ type: "success", text: "Đăng nhập thành công! Đang chuyển hướng..." });

      // Chuyển hướng sau 1.5 giây (ví dụ về trang tài khoản)
      setTimeout(() => {
        window.location.href = "/users";
      }, 1000);
    } catch (err) {
      const errorMessage = "Lỗi kết nối server.";
      console.log(err);
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageClass = () => {
    if (!message) return "";
    return message.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-10">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-600">Đăng Nhập</h1>

        {message && <div className={`p-3 border rounded-lg mb-4 ${getMessageClass()}`}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="userName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nhập tên đăng nhập"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nhập mật khẩu"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
            }`}
          >
            {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
