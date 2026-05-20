// frontend/src/app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import { changePassword } from "@/services/user.api";

export default function ChangePassPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "error", text: "Bạn chưa đăng nhập vào hệ thống!!!" });
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Xác nhận mật khẩu mới không khớp." });
      return;
    }

    if (oldPassword === newPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới phải khác mật khẩu hiện tại." });
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(oldPassword, newPassword);

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Đổi mật khẩu thành công. Hệ thống sẽ đăng xuất để bạn đăng nhập lại." });

      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const serverMessage =
          typeof err.response?.data?.message === "string" ? err.response.data.message : undefined;

        if (err.response?.status === 401) {
          setMessage({ type: "error", text: serverMessage || "Mật khẩu hiện tại không đúng." });
        } else {
          setMessage({ type: "error", text: serverMessage || "Không thể đổi mật khẩu." });
        }
      } else {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Lỗi kết nối server." });
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
    <ProtectedRoute allowedRoles={["admin", "user"]} redirectTo="/" fallback={<p>Redirecting...</p>}>
      <div className="min-h-screen flex items-start justify-center pt-10 px-4 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-center text-green-600">Đổi mật khẩu</h1>
          <p className="text-sm text-center text-gray-500 mb-6">Nhập mật khẩu hiện tại để xác nhận thay đổi.</p>

          {message && <div className={`p-3 border rounded-lg mb-4 ${getMessageClass()}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="oldPassword" className="block text-gray-700 text-sm font-bold mb-2">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                id="oldPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Nhập mật khẩu hiện tại"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                id="newPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Tối thiểu 6 ký tự"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Nhập lại mật khẩu mới"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
              }`}
            >
              {isLoading ? "Đang xử lý..." : "Thay đổi mật khẩu"}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
