"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth.api";
import ProtectedRoute from "@/components/ProtectedRoute";
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
  const [areaInput, setAreaInput] = useState("");
  const [prefixInput, setPrefixInput] = useState("");

  // Bản đồ mã vùng theo Tỉnh/Thành phố (cập nhật khi có khu vực mới)
  const AREA_PREFIX_MAP: Record<string, { area: string; prefix: string }[]> = {
    "Đồng Tháp": [
      { area: "Lấp Vò", prefix: "PB070900" },
      { area: "ĐT Mười", prefix: "PB070900" },
    ],
    "Tây Ninh": [
      { area: "Bến Cầu", prefix: "PB050900" },
      { area: "Trảng Bàng", prefix: "PB050300" },
    ],
  };

  const handleSubmit = async (e: FormEvent) => {
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

  const provinces = [
    "TP Hà Nội",
    "TP Huế",
    "Quảng Ninh",
    "Cao Bằng",
    "Lạng Sơn",
    "Lai Châu",
    "Điện Biên",
    "Sơn La",
    "Thanh Hóa",
    "Nghệ An",
    "Hà Tĩnh",
    "Tuyên Quang",
    "Lào Cai",
    "Thái Nguyên",
    "Phú Thọ",
    "Bắc Ninh",
    "Hưng Yên",
    "TP Hải Phòng",
    "Ninh Bình",
    "Quảng Trị",
    "TP Đà Nẵng",
    "Quảng Ngãi",
    "Gia Lai",
    "Khánh Hòa",
    "Lâm Đồng",
    "Đắk Lắk",
    "TP Hồ Chí Minh",
    "Đồng Nai",
    "Tây Ninh",
    "TP Cần Thơ",
    "Vĩnh Long",
    "Đồng Tháp",
    "Cà Mau",
    "An Giang",
  ];

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
                <div className="flex gap-2 items-center">
                  <select
                    className="shadow border rounded py-2 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                    value=""
                    onChange={(e) => {
                      const sel = (AREA_PREFIX_MAP[province] || []).find((x) => x.area === e.target.value);
                      if (sel) {
                        setAreaInput(sel.area);
                        setPrefixInput(sel.prefix);
                      }
                    }}
                  >
                    <option value="">-- Chọn xã/phường --</option>
                    {(AREA_PREFIX_MAP[province] || []).map((opt) => (
                      <option key={opt.area + opt.prefix} value={opt.area}>
                        {opt.area} - {opt.prefix}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="shadow border rounded py-2 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                    placeholder="Xã/Phường"
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                  />
                  <input
                    type="text"
                    className="shadow border rounded py-2 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
                    placeholder="Prefix"
                    value={prefixInput}
                    onChange={(e) => setPrefixInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="bg-blue-600 text-white font-bold rounded w-9 h-9 flex items-center justify-center hover:bg-blue-700 shrink-0"
                    title="Thêm khu vực + prefix"
                    onClick={() => {
                      const a = areaInput.trim();
                      const p = prefixInput.trim();
                      if (!a || !p) return;
                      setAreaPrefixes((prev) =>
                        prev.some((x) => x.area === a && x.prefix === p) ? prev : [...prev, { area: a, prefix: p }]
                      );
                      setAreaInput("");
                      setPrefixInput("");
                    }}
                  >
                    +
                  </button>
                </div>
                {areaPrefixes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {areaPrefixes.map((it, idx) => (
                      <span
                        key={`${it.area}-${it.prefix}-${idx}`}
                        className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-full px-3 py-1"
                      >
                        {it.area} - {it.prefix}
                        <button
                          type="button"
                          className="ml-1 text-blue-600 hover:text-red-600 font-bold"
                          onClick={() => setAreaPrefixes((prev) => prev.filter((_, i) => i !== idx))}
                          title="Xóa"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
