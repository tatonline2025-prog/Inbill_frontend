"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { generateBillingPeriods, PROVINCES } from "@/constants/invoice.constants";
import { excelUp } from "@/services/excel.api";
import { invoiceSummary } from "@/services/invoice.api";
import { deleteUserByAdmin, fetchallUser, updateUserByAdmin } from "@/services/user.api";
import { formatDateVN } from "@/lib/date-vn";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";
import { IInvoiceSummaryByUser } from "@/types/invoice";
import { IUser } from "@/types/user";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function UsersPage() {
  const [userData, setUserData] = useState<IUser[]>([]);
  const [message, setMessage] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<IInvoiceSummaryByUser[]>([]);

  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<Partial<IUser> & { areaPrefixes?: { area: string; prefix: string }[] }>();
  const [selectedProvince, setSelectedProvince] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editArea, setEditArea] = useState("");
  const [editPrefix, setEditPrefix] = useState("");

  const { map: AREA_PREFIX_MAP } = useAreaPrefixMap();

  const [selectedUserForUpload, setSelectedUserForUpload] = useState<IUser | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("");
  const [showBillingModal, setShowBillingModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const provinces = useMemo(() => PROVINCES, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchallUser();
        // console.log(res);

        setUserData(res.data.user);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchInvoices = async () => {
      try {
        const res = await invoiceSummary();
        // console.log(res);

        setSummaryData(res.data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
      }
    };

    fetchInvoices();
    fetchData();
  }, []);

  const mergedUsers = userData
    .filter((u) => u.usertype === "internal")
    .map((u) => {
      const summary = summaryData.find((s) => s.assignedTo?._id === u._id);
      return {
        ...u,
        notCollectedCount: summary?.notCollectedCount ?? 0,
        collectedCount: summary?.collectedCount ?? 0,
      };
    });

  const filteredUsers = selectedProvince ? mergedUsers.filter((u) => u.province === selectedProvince) : mergedUsers;

  // console.log(mergedUsers);

  const handleFileChange = async (userId: string, billingPeriod?: string) => {
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setMessage({ type: "error", text: "Vui lòng chọn file Excel (.xlsx hoặc .xls)." });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "info", text: `Đang tải file cho user: ${userId} (${billingPeriod})...` });

    const formData = new FormData();
    formData.append("excelFile", selectedFile);
    formData.append("userId", userId);
    formData.append("billing_period", selectedBillingPeriod);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Bạn chưa đăng nhập!");

      await excelUp(formData, token);
      // console.log("Upload thành công:", response.data);

      setMessage({ type: "success", text: `Đã tải file cho ${userId} (${billingPeriod}) thành công.` });
      toast.success(`Đã up file thành công.`);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: getErrorMessage(error) });
      toast.success(`Up file thất bại`);
    } finally {
      setIsLoading(false);
      setShowBillingModal(false);
      setSelectedBillingPeriod("");
      setSelectedUserForUpload(null);
    }
  };

  const totalAdmins = userData.filter((u) => u.role === "admin").length;
  const totalInternalUsers = filteredUsers.filter((u) => u.usertype === "internal").length;

  // console.log(filteredUsers);

  const handleEditClick = (user: IUser) => {
    setEditingUser(user);
    const existingAreaPrefixes = (user as unknown as { areaPrefixes?: { area: string; prefix: string }[] })
      .areaPrefixes;
    setFormData({
      fullName: user.fullName,
      email: user.email,
      province: user.province || "",
      username: user.username || "",
      pass: user.pass || "",
      phone: user.phone || "",
      stt: user.stt || "",
      usertype: user.usertype || "",
      areaPrefixes: Array.isArray(existingAreaPrefixes) ? existingAreaPrefixes : [],
    });
    setEditingIdx(null);
    setEditArea("");
    setEditPrefix("");
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bạn có chắc muốn xoá tài khoản này không?")) return;
    try {
      const token = localStorage.getItem("token");
      setIsLoading(true);
      await deleteUserByAdmin(userId, token!);

      setUserData((prev) => prev.filter((u) => u._id !== userId));
      setMessage({ type: "success", text: "Đã xoá tài khoản thành công!" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setIsLoading(false);
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
        phone: "",
        stt: "",
        usertype: "",
      });
      toast.success("Cập nhật thông tin người dùng thành công");
    } catch (err) {
      console.error(err);
      setEditingUser(null);
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  };

  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-orange-600">Danh Sách Tài Khoản Người Dùng</h1>

        <div className="p-3 mb-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-300 rounded-md">
          ⚠️ Lưu ý: Chỉ upload file Excel (.xlsx hoặc .xls) đúng định dạng. Mỗi lần chỉ tải lên cho một người dùng. Mỗi
          file Excel phải có các header như hình dưới đây để cho hệ thống có thể đọc được, thứ tự các cột thì tuỳ ý.
        </div>

        <div className="relative w-full h-[350px] mx-auto mb-6">
          <Image
            src="/images/example_excel.png"
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                <h2 className="text-lg font-semibold text-blue-600">Tài khoản Quản trị (Admin)</h2>

                <Link
                  href="/register"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Đăng ký tài khoản con
                </Link>
              </div>
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
                        Số điện thoại
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
                          <td className="px-6 py-4 text-sm text-gray-700">{user.phone}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDateVN(user.createdAt)}
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="w-full md:flex-1 md:min-w-[250px] bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 font-semibold shadow-sm">
                  Tổng số tài khoản Người dùng (User): <span className="text-green-900">{totalInternalUsers}</span>
                </div>

                {/* Dropdown lọc tỉnh */}
                <div className="flex items-center gap-2 w-full md:w-auto bg-white md:bg-transparent p-1 md:p-0 rounded-md">
                  <label htmlFor="provinceFilter" className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    Lọc theo tỉnh:
                  </label>
                  <select
                    id="provinceFilter"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="flex-1 md:flex-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Tất cả</option>
                    {Array.from(new Set(mergedUsers.map((u) => u.province))).map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-green-200 rounded-lg">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số điện thoại
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
                        Chọn Excel
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers
                      .filter((user) => user.usertype === "internal")
                      .map((user) => {
                        return (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-700">{user.stt}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{user.fullName}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{user.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{user.province}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDateVN(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">
                              {(user.collectedCount ?? 0) + (user.notCollectedCount ?? 0)}
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
                              <button
                                onClick={() => {
                                  setSelectedUserForUpload(user);
                                  setShowBillingModal(true);
                                }}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                              >
                                Chọn Excel
                              </button>
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
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
              {/* HEADER */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa thông tin</h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5 ml-1">Họ và tên</label>
                    <input
                      type="text"
                      value={formData?.fullName || ""}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block p-2.5 transition-all duration-200 outline-none placeholder:text-gray-400"
                      placeholder="Nhập đầy đủ họ và tên..."
                    />
                  </div>

                  <div className="w-20">
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5 text-center">STT</label>
                    <input
                      type="text"
                      id="order"
                      value={formData?.stt || ""}
                      onChange={(e) => setFormData({ ...formData, stt: e.target.value })}
                      className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block p-2.5 text-center transition-all duration-200 outline-none placeholder:text-gray-400"
                      placeholder="Số"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={formData?.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="09xxx..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Loại tài khoản</label>
                    <select
                      value={formData?.usertype}
                      onChange={(e) => setFormData({ ...formData, usertype: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 font-medium outline-none focus:ring-2 ${
                        formData?.usertype === "internal"
                          ? "border-green-300 bg-green-50 text-green-800 focus:ring-green-500"
                          : "border-purple-300 bg-purple-50 text-purple-800 focus:ring-purple-500"
                      }`}
                    >
                      <option value="internal">Nhân viên nội bộ</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div style={{ flex: "0 0 40%" }}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                    <select
                      value={formData?.province || ""}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Chọn tỉnh --</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 60%" }}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Xã/Phường &amp; Prefix mã hóa đơn
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden text-sm">
                      {/* Quick-pick dropdown + nút thêm mới */}
                      <div className="flex items-center border-b border-gray-200 bg-gray-50">
                        <select
                          className="flex-1 py-2 px-2 text-gray-700 bg-transparent focus:outline-none"
                          value=""
                          onChange={(e) => {
                            const prov = formData?.province || "";
                            const opt = (AREA_PREFIX_MAP[prov] || []).find((x) => x.area === e.target.value);
                            if (!opt) return;
                            setFormData((prev) => {
                              const list = prev?.areaPrefixes || [];
                              if (list.some((x) => x.area === opt.area && x.prefix === opt.prefix)) return prev;
                              return { ...prev, areaPrefixes: [...list, opt] };
                            });
                          }}
                        >
                          <option value="">-- Chọn xã/phường --</option>
                          {(AREA_PREFIX_MAP[formData?.province || ""] || []).map((opt) => (
                            <option key={opt.area + opt.prefix} value={opt.area}>
                              {opt.area} – {opt.prefix}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="bg-blue-600 text-white font-bold w-9 h-9 flex items-center justify-center hover:bg-blue-700 shrink-0"
                          title="Thêm mới"
                          onClick={() => { setEditingIdx(-1); setEditArea(""); setEditPrefix(""); }}
                        >
                          +
                        </button>
                      </div>
                      {/* Danh sách đã thêm */}
                      {(formData?.areaPrefixes || []).map((it, idx) =>
                        editingIdx === idx ? (
                          <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-blue-50 border-b border-gray-200">
                            <input
                              className="flex-1 border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={editArea}
                              onChange={(e) => setEditArea(e.target.value)}
                              placeholder="Xã/Phường"
                              autoFocus
                            />
                            <input
                              className="w-28 border rounded px-1 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={editPrefix}
                              onChange={(e) => setEditPrefix(e.target.value)}
                              placeholder="Prefix"
                            />
                            <button
                              type="button"
                              className="text-blue-600 hover:text-green-700 font-bold px-1"
                              title="Xác nhận (để trống = xóa)"
                              onClick={() => {
                                const a = editArea.trim();
                                const p = editPrefix.trim();
                                if (!a || !p) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    areaPrefixes: (prev?.areaPrefixes || []).filter((_, i) => i !== idx),
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    areaPrefixes: (prev?.areaPrefixes || []).map((x, i) => (i === idx ? { area: a, prefix: p } : x)),
                                  }));
                                }
                                setEditingIdx(null);
                              }}
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div key={idx} className="flex items-center px-2 py-1.5 border-b border-gray-100 hover:bg-gray-50">
                            <span className="flex-1 text-gray-800">{it.area}</span>
                            <span className="font-mono text-gray-500 text-right mr-2">{it.prefix}</span>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-blue-600"
                              title="Chỉnh sửa"
                              onClick={() => { setEditingIdx(idx); setEditArea(it.area); setEditPrefix(it.prefix); }}
                            >
                              ✏
                            </button>
                          </div>
                        )
                      )}
                      {/* Hàng thêm mới */}
                      {editingIdx === -1 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border-b border-gray-200">
                          <input
                            className="flex-1 border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                            value={editArea}
                            onChange={(e) => setEditArea(e.target.value)}
                            placeholder="Xã/Phường mới"
                            autoFocus
                          />
                          <input
                            className="w-28 border rounded px-1 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-400"
                            value={editPrefix}
                            onChange={(e) => setEditPrefix(e.target.value)}
                            placeholder="Prefix"
                          />
                          <button
                            type="button"
                            className="text-green-600 hover:text-green-800 font-bold px-1"
                            title="Thêm"
                            onClick={() => {
                              const a = editArea.trim();
                              const p = editPrefix.trim();
                              if (a && p) {
                                setFormData((prev) => {
                                  const list = prev?.areaPrefixes || [];
                                  if (list.some((x) => x.area === a && x.prefix === p)) return prev;
                                  return { ...prev, areaPrefixes: [...list, { area: a, prefix: p }] };
                                });
                              }
                              setEditingIdx(null);
                              setEditArea("");
                              setEditPrefix("");
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      )}
                      {/* Trạng thái rỗng */}
                      {(!formData?.areaPrefixes || formData.areaPrefixes.length === 0) && editingIdx !== -1 && (
                        <div className="px-2 py-2 text-gray-400 italic">Chưa có khu vực nào</div>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100 my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={formData?.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu mới</label>
                    <input
                      type="text"
                      placeholder="Nhập để đổi pass..."
                      value={formData?.pass}
                      onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      ⚠️ Lưu ý: Mật khẩu sẽ được đổi ngay lập tức mà không cần xác minh cũ.
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {showBillingModal && selectedUserForUpload && (
          <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
            <div className="bg-white rounded-lg shadow-lg w-[400px] p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Tải Excel lên cho {selectedUserForUpload.fullName}
              </h2>

              <div className="space-y-4">
                {/* 🔹 Chọn tháng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Kỳ</label>
                  <select
                    value={selectedBillingPeriod}
                    onChange={(e) => setSelectedBillingPeriod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="">-- Chọn Kỳ --</option>
                    {generateBillingPeriods().map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn file Excel</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    disabled={isLoading}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer 
                       file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 
                       file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    if (!selectedFile) {
                      alert("Vui lòng chọn file trước khi tải lên!");
                      return;
                    }
                    handleFileChange(selectedUserForUpload._id, selectedBillingPeriod);
                  }}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-white transition-colors ${
                    isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? "Đang tải..." : "Tải lên"}
                </button>

                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    setSelectedBillingPeriod("");
                    setSelectedUserForUpload(null);
                  }}
                  className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
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
