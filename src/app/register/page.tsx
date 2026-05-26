"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import ProtectedRoute from "@/components/ProtectedRoute";
import { compareAreaPrefixEntries, formatAreaPrefixLabel } from "@/lib/area-prefix";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";
import { register } from "@/services/auth.api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [order, setOrder] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAreaConfigId, setSelectedAreaConfigId] = useState("");
  const [userType, setUserType] = useState<"internal" | "">("internal");
  const router = useRouter();

  const { configs: areaConfigs, isLoading: isAreaConfigLoading } = useAreaPrefixMap();

  const sortedAreaConfigs = useMemo(
    () => [...areaConfigs].sort((left, right) => compareAreaPrefixEntries(left, right)),
    [areaConfigs]
  );

  const selectedAreaConfig = useMemo(
    () => sortedAreaConfigs.find((config) => config._id === selectedAreaConfigId) ?? null,
    [selectedAreaConfigId, sortedAreaConfigs]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!selectedAreaConfig) {
      setMessage({ type: "error", text: "Vui lòng chọn xã/phường từ danh sách mã vùng." });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, password, fullName, userType, phone, order, [
        { area: selectedAreaConfig.area, prefix: selectedAreaConfig.prefix },
      ]);

      setMessage({ type: "success", text: "Đăng ký thành công. Đang chuyển hướng..." });
      setTimeout(() => router.push("/"), 1500);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage({
          type: "error",
          text:
            typeof error.response?.data?.message === "string"
              ? error.response.data.message
              : "Không thể tạo tài khoản. Vui lòng thử lại.",
        });
      } else {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Đã có lỗi xảy ra.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const messageClass =
    message?.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";

  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="min-h-screen flex items-start justify-center pt-10 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-xl">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">Đăng Ký Tài Khoản</h1>

          {message && <div className={`p-3 border rounded-lg mb-6 ${messageClass}`}>{message.text}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-[3]">
                <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nhập đầy đủ họ và tên"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-20">
                <label htmlFor="order" className="block text-gray-700 text-sm font-bold mb-2">
                  STT
                </label>
                <input
                  id="order"
                  type="text"
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  placeholder="Số"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-center text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="09xxx..."
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="userType" className="block text-gray-700 text-sm font-bold mb-2">
                  Loại người dùng
                </label>
                <select
                  id="userType"
                  disabled
                  value={userType}
                  onChange={(event) => setUserType(event.target.value as "internal" | "")}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="internal">Nhân viên nội bộ</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="areaConfig" className="block text-gray-700 text-sm font-bold mb-2">
                  Xã/Phường
                </label>
                <select
                  id="areaConfig"
                  required
                  value={selectedAreaConfigId}
                  onChange={(event) => setSelectedAreaConfigId(event.target.value)}
                  disabled={isAreaConfigLoading}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {isAreaConfigLoading ? "-- Đang tải danh sách --" : "-- Chọn xã/phường --"}
                  </option>
                  {sortedAreaConfigs.map((config) => (
                    <option key={config._id} value={config._id}>
                      {formatAreaPrefixLabel(config)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="prefix" className="block text-gray-700 text-sm font-bold mb-2">
                  Prefix mã hóa đơn
                </label>
                <input
                  id="prefix"
                  type="text"
                  readOnly
                  value={selectedAreaConfig?.prefix || ""}
                  placeholder={selectedAreaConfig?.prefix ? "" : "Để trống khi chọn Tự do"}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                  Tên đăng nhập
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Username"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="******"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-blue-600 text-white font-bold py-3 px-4 rounded w-full transition duration-300 ${
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
