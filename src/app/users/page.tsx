"use client";

import AdminRoute from "@/components/AdminRoute";
import { excelUp } from "@/services/excel.api";
import { fetchallInvoice } from "@/services/invoice.api";
import { deleteUserByAdmin, fetchallUser, updateUserByAdmin } from "@/services/user.api";
import { InvoiceInfo } from "@/types/invoice";
import { IUser } from "@/types/user";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

export default function UsersPage() {
  const [userData, setUserData] = useState<IUser[]>([]);
  const [message, setMessage] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);

  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<Partial<IUser>>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchallUser();
        setUserData(res.data.user);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchInvoices = async () => {
      try {
        const res = await fetchallInvoice();
        const data = res.data; // nếu backend trả trực tiếp mảng
        // const data = res.data.result; // nếu backend trả { result: [...] }

        // console.log(data);

        setInvoices(data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
      }
    };

    fetchInvoices();
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

  const totalAdmins = userData.filter((u) => u.role === "admin").length;
  const totalUsers = userData.filter((u) => u.role === "user").length;

  const handleEditClick = (user: IUser) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      province: user.province || "",
      username: user.username || "",
      pass: user.pass || "",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn xoá tài khoản này không?")) return;
    try {
      const token = localStorage.getItem("token");
      await deleteUserByAdmin(userId, token!);

      setUserData((prev) => prev.filter((u) => u._id !== userId));
      setMessage({ type: "success", text: "Đã xoá tài khoản thành công!" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const token = localStorage.getItem("token");
      await updateUserByAdmin(editingUser._id, formData!, token!);
      setUserData((prev) => prev.map((u) => (u._id === editingUser._id ? { ...u, ...formData } : u)));
      setMessage({ type: "success", text: "Cập nhật tài khoản thành công!" });
      setEditingUser(null);
      setFormData({
        fullName: "",
        email: "",
        province: "",
        username: "",
        pass: "",
      });
    } catch (err) {
      console.error(err);
      setEditingUser(null);
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  };

  return (
    <AdminRoute fallback={<p>Redirecting...</p>}>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-orange-600">Danh Sách Tài Khoản Người Dùng</h1>

        <div className="p-3 mb-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-300 rounded-md">
          ⚠️ Lưu ý: Chỉ upload file Excel (.xlsx hoặc .xls) đúng định dạng. Mỗi lần chỉ tải lên cho một người dùng. Mỗi
          file Excel phải có các header như hình dưới đây để cho hệ thống có thể đọc được, thứ tự các cột thì tuỳ ý.
        </div>

        <div className="relative w-full h-[350px] mx-auto mb-6">
          <Image
            src="/images/example_excel.jpg"
            alt="Hướng dẫn upload file Excel"
            fill
            className="object-contain rounded-lg shadow"
          />
        </div>

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
          <div className="space-y-10">
            {/* --- DANH SÁCH ADMIN --- */}
            <div>
              <h2 className="text-lg font-semibold text-blue-600 mb-3">Tài khoản Quản trị (Admin)</h2>
              <div className="flex-1 min-w-[250px] bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 font-semibold shadow-sm">
                Tổng số tài khoản Quản trị (Admin): <span className="text-blue-900">{totalAdmins}</span>
              </div>
              <div className="overflow-x-auto border border-blue-200 rounded-lg">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userData
                      .filter((user) => user.role === "admin")
                      .map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-700">{user.fullName}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- DANH SÁCH USER --- */}
            <div>
              <h2 className="text-lg font-semibold text-green-600 mb-3">Tài khoản Người dùng (User)</h2>
              <div className="flex-1 min-w-[250px] bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 font-semibold shadow-sm">
                Tổng số tài khoản Người dùng (User): <span className="text-green-900">{totalUsers}</span>
              </div>
              <div className="overflow-x-auto border border-green-200 rounded-lg">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tỉnh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                        Số hoá đơn phụ trách
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                        Hành động
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                        Upload Excel
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userData
                      .filter((user) => user.role === "user")
                      .map((user) => {
                        const invoiceCount = invoices.filter(
                          (inv) => inv.assignedTo && inv.assignedTo._id === user._id
                        ).length;

                        return (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-700">{user.fullName}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{user.province}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">
                              {invoiceCount}
                            </td>
                            <td className="px-6 py-4 text-center space-x-2">
                              <button
                                onClick={() => handleEditClick(user)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                              >
                                Xoá
                              </button>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <input
                                type="file"
                                id={`fileUpload-${user._id}`}
                                accept=".xlsx, .xls"
                                disabled={isLoading}
                                onChange={(e) => handleFileChange(e, user._id)}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
            <div className="bg-white rounded-lg shadow-lg w-[400px] p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Chỉnh sửa tài khoản</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                  <input
                    type="text"
                    value={formData?.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData?.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tỉnh</label>
                  <input
                    type="text"
                    value={formData?.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={formData?.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                  <input
                    type="text"
                    value={formData?.pass}
                    onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring focus:ring-blue-200"
                  />
                  <span className="text-red-500 text-sm">
                    Lưu ý: Thay đổi mật khẩu không qua xác minh. Hãy cân nhắc.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
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
