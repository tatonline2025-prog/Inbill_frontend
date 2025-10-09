"use client";

import AdminRoute from "@/components/AdminRoute";
import { excelUp } from "@/services/excel.api";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";
import { ChangeEvent, useEffect, useState } from "react";

export default function UsersPage() {
  const [userData, setUserData] = useState<IUser[]>([]);
  const [message, setMessage] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchallUser();
        setUserData(res.data.user);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, userId: string) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ type: "error", text: "Vui lòng chọn file Excel (.xlsx hoặc .xls)." });
        return;
      }

      setIsLoading(true);
      setMessage({ type: "info", text: `Đang tải file lên cho user: ${userId}...` });

      const formData = new FormData();
      formData.append("excelFile", selectedFile);
      formData.append("userId", userId); // ✅ gửi kèm id user

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Bạn chưa đăng nhập!");

        const response = await excelUp(formData, token);
        console.log("Upload thành công:", response.data);

        setMessage({ type: "success", text: `Đã tải file cho user ${userId} thành công.` });
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: getErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AdminRoute fallback={<p>Redirecting...</p>}>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-orange-600">Danh Sách Tài Khoản Người Dùng</h1>

        {message && (
          <div
            className={`p-3 mb-4 rounded-md text-center ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isLoading && <span className="animate-spin mr-2">⏳</span>}
            {message.text}
          </div>
        )}

        {userData.length === 0 ? (
          <div className="text-gray-500 p-4 border rounded-lg bg-gray-50">Chưa có tài khoản nào được đăng ký.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    Upload Excel
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userData.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user._id.substring(user._id.length - 4)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="file"
                        id={`fileUpload-${user._id}`}
                        accept=".xlsx, .xls"
                        disabled={isLoading}
                        onChange={(e) => handleFileChange(e, user._id)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}

interface AxiosLikeError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  // Nếu là object kiểu Axios

  const err = error as AxiosLikeError;

  // ưu tiên message từ response.data.message
  if (err.response?.data?.message) {
    return err.response.data.message;
  } else {
    return "Lỗi không xác định";
  }
}
