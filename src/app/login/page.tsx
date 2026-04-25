"use client";

import { FormEvent, useState } from "react";
import axios from "axios";
import { login } from "@/services/auth.api";
import { getApiBaseUrl } from "@/lib/api-base-url";

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const apiUrl = getApiBaseUrl();
    if (!apiUrl) {
      setMessage({ type: "error", text: "Loi cau hinh API." });
      setIsLoading(false);
      return;
    }

    try {
      const res = await login(userName, password);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setMessage({ type: "success", text: "Dang nhap thanh cong. Dang chuyen huong..." });

      setTimeout(() => {
        const role = res.data.user.role;
        window.location.href = role === "admin" ? "/home" : "/userhome";
      }, 500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const serverMessage =
          typeof err.response?.data?.message === "string" ? err.response.data.message : undefined;

        if (status === 401) {
          setMessage({ type: "error", text: "Sai tên đăng nhập hoặc mật khẩu." });
        } else if (status === 404) {
          setMessage({ type: "error", text: "Không tìm thấy API đăng nhập. Kiểm tra BE/FE local." });
        } else if (status === 500) {
          setMessage({ type: "error", text: serverMessage || "Server login đang lỗi nội bộ (HTTP 500)." });
        } else if (!err.response) {
          setMessage({ type: "error", text: "Không kết nối được với Server." });
        } else {
          setMessage({ type: "error", text: serverMessage || `Đăng nhập thất bại (HTTP ${status}).` });
        }
      } else {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Có lỗi không xác định khi đăng nhập.",
        });
      }
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
            <label htmlFor="userName" className="block text-gray-700 text-sm font-bold mb-2">
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
            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="shadow appearance-none border rounded w-full py-2 pl-3 pr-12 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Nhập mật khẩu"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
            }`}
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
