"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth.api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PROVINCES } from "@/constants/invoice.constants";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";
import axios from "axios";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [order, setOrder] = useState("");
  const [province, setProvince] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [userType, setUserType] = useState<"internal" | "">("internal");
  const [areaPrefixes, setAreaPrefixes] = useState<{ area: string; prefix: string }[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editArea, setEditArea] = useState("");
  const [editPrefix, setEditPrefix] = useState("");

  const { map: AREA_PREFIX_MAP } = useAreaPrefixMap();

  const provinces = PROVINCES;
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      await register(name, password, fullName, province, userType, phone, order, areaPrefixes);

      setMessage({ type: "success", text: "Đăng ký thành công! Đang chuyển hướng..." });

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Axios error: ", err);
        setMessage({ type: "error", text: err.response?.data.message });
      } else {
        console.error("Unexpected error:", err);
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

  const provinces = PROVINCES;

  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="min-h-screen flex items-start justify-center pt-10 bg-gray-50">
        {/* Tăng max-w lên xl để các hàng 2-3 cột không bị quá hẹp */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-xl">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">Đăng Ký Tài Khoản</h1>

          {message && <div className={`p-3 border rounded-lg mb-6 ${getMessageClass()}`}>{message.text}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-[3]">
                <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="fullName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập đầy đủ họ và tên"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="w-20">
                <label htmlFor="order" className="block text-gray-700 text-sm font-bold mb-2">
                  STT
                </label>
                <input
                  type="text"
                  id="order"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  placeholder="Số"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
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
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="09xxx..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="userType" className="block text-gray-700 text-sm font-bold mb-2">
                  Loại Người dùng
                </label>
                <select
                  id="userType"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                  disabled
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as "internal" | "")}
                >
                  <option value="internal">Nhân viên Nội bộ</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div style={{ flex: "0 0 40%" }}>
                <label htmlFor="province" className="block text-gray-700 text-sm font-bold mb-2">
                  Tỉnh / Thành phố
                </label>
                <select
                  id="province"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                  <option value="">-- Chọn tỉnh --</option>
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
                        const opt = (AREA_PREFIX_MAP[province] || []).find((x) => x.area === e.target.value);
                        if (!opt) return;
                        setAreaPrefixes((prev) =>
                          prev.some((x) => x.area === opt.area && x.prefix === opt.prefix) ? prev : [...prev, opt]
                        );
                      }}
                    >
                      <option value="">-- Chọn xã/phường --</option>
                      {(AREA_PREFIX_MAP[province] || []).map((opt) => (
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
                  {areaPrefixes.map((it, idx) =>
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
                              setAreaPrefixes((prev) => prev.filter((_, i) => i !== idx));
                            } else {
                              setAreaPrefixes((prev) => prev.map((x, i) => (i === idx ? { area: a, prefix: p } : x)));
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
                            setAreaPrefixes((prev) =>
                              prev.some((x) => x.area === a && x.prefix === p) ? prev : [...prev, { area: a, prefix: p }]
                            );
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
                  {areaPrefixes.length === 0 && editingIdx !== -1 && (
                    <div className="px-2 py-2 text-gray-400 italic">Chưa có khu vực nào</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  id="name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="******"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-blue-600 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
              >
                {isLoading ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
