"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
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
  const router = useRouter();

  const [userType, setUserType] = useState<"internal" | "">("internal");
  const { configs: areaConfigs, isLoading: isAreaConfigLoading } = useAreaPrefixMap();

  const sortedAreaConfigs = useMemo(
    () => [...areaConfigs].sort((a, b) => a.area.localeCompare(b.area, "vi") || a.prefix.localeCompare(b.prefix, "vi")),
    [areaConfigs]
  );

  const areaNameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    sortedAreaConfigs.forEach((config) => {
      counts.set(config.area, (counts.get(config.area) ?? 0) + 1);
    });
    return counts;
  }, [sortedAreaConfigs]);

  const selectedAreaConfig = useMemo(
    () => sortedAreaConfigs.find((config) => config._id === selectedAreaConfigId) ?? null,
    [sortedAreaConfigs, selectedAreaConfigId]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedAreaConfig) {
      setMessage({ type: "error", text: "Vui lòng chọn xã/phường từ danh sách mã vùng." });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, password, fullName, selectedAreaConfig.province, userType, phone, order, [
        { area: selectedAreaConfig.area, prefix: selectedAreaConfig.prefix },
      ]);

      setMessage({ type: "success", text: "Đăng ký thành công! Đang chuyển hướng..." });

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage({
          type: "error",
          text:
            typeof err.response?.data?.message === "string"
              ? err.response.data.message
              : "Không thể tạo tài khoản. Vui lòng thử lại.",
        });
      } else {
        setMessage({ type: "error", text: err instanceof Error ? err.message : "Đã có lỗi xảy ra." });
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
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <div className="min-h-screen flex items-start justify-center pt-10 bg-gray-50">
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
              <div className="flex-1">
                <label htmlFor="areaConfig" className="block text-gray-700 text-sm font-bold mb-2">
                  Xã/Phường
                </label>
                <select
                  id="areaConfig"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={selectedAreaConfigId}
                  onChange={(e) => setSelectedAreaConfigId(e.target.value)}
                  disabled={isAreaConfigLoading}
                >
                  <option value="">
                    {isAreaConfigLoading ? "-- Đang tải danh sách --" : "-- Chọn xã/phường --"}
                  </option>
                  {sortedAreaConfigs.map((config) => {
                    const hasDuplicateAreaName = (areaNameCounts.get(config.area) ?? 0) > 1;
                    return (
                      <option key={config._id} value={config._id}>
                        {hasDuplicateAreaName ? `${config.area} (${config.prefix})` : config.area}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="prefix" className="block text-gray-700 text-sm font-bold mb-2">
                  Prefix mã hóa đơn
                </label>
                <input
                  type="text"
                  id="prefix"
                  readOnly
                  value={selectedAreaConfig?.prefix || ""}
                  placeholder="Tự động theo xã/phường"
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
