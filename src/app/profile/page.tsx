"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiUpdateUser } from "@/services/user.api";
import { PROVINCES } from "@/constants/invoice.constants";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";
import axios from "axios";

type Message = {
  type: "success" | "error";
  text: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  console.log(user);

  const [formData, setFormData] = useState({
    fullName: "",
    stt: "",
    usertype: "",
    phone: "",
    pass: "",
    username: "",
    province: "",
    areaPrefixes: [] as { area: string; prefix: string }[],
    // bankAccount: "",
    // bankName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editArea, setEditArea] = useState("");
  const [editPrefix, setEditPrefix] = useState("");

  const { map: AREA_PREFIX_MAP } = useAreaPrefixMap();
  const provinces = PROVINCES;

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        pass: "",
        stt: user.stt || "",
        usertype: user.usertype || "",
        phone: user.phone || "",
        username: user.username || "",
        province: user.province || "",
        areaPrefixes: Array.isArray((user as unknown as { areaPrefixes?: { area: string; prefix: string }[] }).areaPrefixes)
          ? (user as unknown as { areaPrefixes: { area: string; prefix: string }[] }).areaPrefixes
          : [],
        // bankAccount: user.bankAccount || "",
        // bankName: user.bankName || "",
      });
    }
  }, [user]);

  if (!isAuthenticated) {
    return <div className="p-8 text-center text-red-600 font-bold">Bạn cần đăng nhập để xem trang này.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const selectedBin = e.target.value;
  //   const selectedBank = VIET_BANKS.find((b) => b.bin === selectedBin);

  //   setFormData((prev) => ({
  //     ...prev,
  //     bankBin: selectedBin,
  //     bankName: selectedBank ? selectedBank.shortName : "",
  //   }));
  // };

  const getMessageClass = () => {
    if (!message) return "";
    return message.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await apiUpdateUser(user._id, formData);
      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage({ type: "error", text: error.response?.data?.message || "Lỗi cập nhật thông tin" });
      } else {
        setMessage({ type: "error", text: "Đã xảy ra lỗi không xác định." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-10 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">Thông Tin Cá Nhân</h1>

        {message && <div className={`p-3 border rounded-lg mb-6 ${getMessageClass()}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-[2]">
              <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="w-20">
              <label htmlFor="order" className="block text-gray-700 text-sm font-bold mb-2">
                STT
              </label>
              <input
                type="text"
                id="stt"
                name="stt"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Số"
                value={formData.stt}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="09xxx..."
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="flex-1">
              <label htmlFor="userType" className="block text-gray-700 text-sm font-bold mb-2">
                Loại Người dùng
              </label>
              <input
                type="text"
                id="userType"
                name="userType"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                disabled
                value={formData.usertype === "internal" ? "Nhân viên nội bộ" : "Khác"}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div style={{ flex: "0 0 40%" }}>
              <label htmlFor="province" className="block text-gray-700 text-sm font-bold mb-2">
                Tỉnh / Thành phố
              </label>
              <select
                id="province"
                name="province"
                required
                value={formData.province}
                onChange={handleChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn --</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 60%" }}>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Xã/Phường &amp; Prefix mã hóa đơn
              </label>
              <div className="border rounded overflow-hidden text-sm">
                {/* Quick-pick dropdown + nút thêm mới */}
                <div className="flex items-center border-b bg-gray-50">
                  <select
                    className="flex-1 py-2 px-2 text-gray-700 bg-transparent focus:outline-none"
                    value=""
                    onChange={(e) => {
                      const opt = (AREA_PREFIX_MAP[formData.province] || []).find((x) => x.area === e.target.value);
                      if (!opt) return;
                      setFormData((prev) => ({
                        ...prev,
                        areaPrefixes: prev.areaPrefixes.some((x) => x.area === opt.area && x.prefix === opt.prefix)
                          ? prev.areaPrefixes
                          : [...prev.areaPrefixes, opt],
                      }));
                    }}
                  >
                    <option value="">-- Chọn xã/phường --</option>
                    {(AREA_PREFIX_MAP[formData.province] || []).map((opt) => (
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
                {formData.areaPrefixes.map((it, idx) =>
                  editingIdx === idx ? (
                    <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-blue-50 border-b">
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
                            setFormData((prev) => ({ ...prev, areaPrefixes: prev.areaPrefixes.filter((_, i) => i !== idx) }));
                          } else {
                            setFormData((prev) => ({ ...prev, areaPrefixes: prev.areaPrefixes.map((x, i) => (i === idx ? { area: a, prefix: p } : x)) }));
                          }
                          setEditingIdx(null);
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div key={idx} className="flex items-center px-2 py-1.5 border-b hover:bg-gray-50">
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
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border-b">
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
                          setFormData((prev) => ({
                            ...prev,
                            areaPrefixes: prev.areaPrefixes.some((x) => x.area === a && x.prefix === p)
                              ? prev.areaPrefixes
                              : [...prev.areaPrefixes, { area: a, prefix: p }],
                          }));
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
                {formData.areaPrefixes.length === 0 && editingIdx !== -1 && (
                  <div className="px-2 py-2 text-gray-400 italic">Chưa có khu vực nào</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tên đăng nhập"
              />
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
              <input
                type="password"
                id="pass"
                name="pass"
                value={formData.pass}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="*******"
              />
            </div>
          </div>

          {/* <h3 className="text-lg font-bold text-blue-600 pt-4 border-t border-gray-100">Thông tin ngân hàng</h3>

          <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
            <div>
              <label htmlFor="bankBin" className="block text-sm font-medium text-gray-700">
                Ngân hàng
              </label>
              <select
                id="bankBin"
                name="bankBin"
                value={formData.bankBin}
                onChange={handleBankChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {VIET_BANKS.map((bank) => (
                  <option key={bank.bin} value={bank.bin}>
                    {bank.shortName} - {bank.name}
                  </option>
                ))}
              </select>
            </div>

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
                placeholder="VD: 1903..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div> */}

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-blue-600 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Đang cập nhật..." : "Cập Nhật Thông Tin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
