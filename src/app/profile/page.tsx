"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; // Giả sử hook này cung cấp thông tin user
import { apiUpdateUser } from "@/services/user.api";
// import { apiUpdateUser } from "@/services/api/user"; // Giả sử đây là hàm gọi API cập nhật

type Message = {
  type: "success" | "error";
  text: string;
};

type ProfileFormData = {
  fullName: string;
  email: string;
  username: string;
  province: string;
  bankAccount: string;
  bankName: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    province: "",
    bankAccount: "",
    bankName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (user) {
      // Load dữ liệu user hiện tại vào form
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        username: user.username || "",
        province: user.province || "",
        bankAccount: user.bankAccount || "",
        bankName: user.bankName || "",
      });
    }
  }, [user]);

  if (!isAuthenticated) {
    return <div className="p-8 text-center text-red-600">Bạn cần đăng nhập để xem trang này.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!user) {
      setMessage({ type: "error", text: "Lỗi: Chưa đăng nhập" });
      return;
    }

    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // *** Logic gọi API để cập nhật thông tin ***
    try {
      const response = await apiUpdateUser(user._id, formData);

      // Giả lập cập nhật thành công
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });

      // Có thể cần gọi lại hàm để cập nhật context user sau khi update thành công
      // reloadUser();
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      setMessage({ type: "error", text: "Lỗi: Không thể cập nhật thông tin." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Thông tin cá nhân</h1>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-xl">
        {message && (
          <div
            className={`p-3 mb-4 rounded-md ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
              />
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0 pt-2 border-t border-gray-100">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Tên đầy đủ
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                  Tỉnh/Thành phố
                </label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 pt-4 mt-4 border-t border-gray-200">
              Thông tin Ngân hàng
            </h3>

            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
              <div>
                <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  id="bankAccount"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  Tên Ngân hàng
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
