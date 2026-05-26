"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { useAuth } from "@/hooks/useAuth";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";
import { apiUpdateUser } from "@/services/user.api";
import {
  compareAreaPrefixEntries,
  ensureAreaPrefixes,
  formatAreaPrefixLabel,
  getPrimaryAreaPrefix,
} from "@/lib/area-prefix";

type Message = {
  type: "success" | "error";
  text: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { configs: areaConfigs } = useAreaPrefixMap();

  const sortedAreaConfigs = useMemo(
    () => [...areaConfigs].sort((left, right) => compareAreaPrefixEntries(left, right)),
    [areaConfigs]
  );

  const [formData, setFormData] = useState({
    fullName: "",
    stt: "",
    usertype: "",
    phone: "",
    pass: "",
    username: "",
    areaPrefixes: ensureAreaPrefixes([]),
  });
  const [selectedAreaConfigId, setSelectedAreaConfigId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!user) return;

    const primaryArea = getPrimaryAreaPrefix(user);
    const matchedConfig = sortedAreaConfigs.find(
      (config) => config.area === primaryArea.area && config.prefix === primaryArea.prefix
    );

    setFormData({
      fullName: user.fullName || "",
      pass: "",
      stt: user.stt || "",
      usertype: user.usertype || "",
      phone: user.phone || "",
      username: user.username || "",
      areaPrefixes: ensureAreaPrefixes(user.areaPrefixes),
    });
    setSelectedAreaConfigId(matchedConfig?._id || "");
  }, [sortedAreaConfigs, user]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-bold">Đang tải thông tin tài khoản...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div className="p-8 text-center text-red-600 font-bold">Bạn cần đăng nhập để xem trang này.</div>;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleAreaConfigChange = (configId: string) => {
    setSelectedAreaConfigId(configId);
    const nextConfig = sortedAreaConfigs.find((config) => config._id === configId);
    setFormData((previous) => ({
      ...previous,
      areaPrefixes: nextConfig ? [{ area: nextConfig.area, prefix: nextConfig.prefix }] : ensureAreaPrefixes([]),
    }));
  };

  const getMessageClass = () => {
    if (!message) return "";
    return message.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await apiUpdateUser(user._id, formData);
      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage({ type: "error", text: error.response?.data?.message || "Lỗi cập nhật thông tin." });
      } else {
        setMessage({ type: "error", text: "Đã xảy ra lỗi không xác định." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedArea = sortedAreaConfigs.find((config) => config._id === selectedAreaConfigId) ?? null;

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
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-20">
              <label htmlFor="stt" className="block text-gray-700 text-sm font-bold mb-2">
                STT
              </label>
              <input
                id="stt"
                name="stt"
                type="text"
                value={formData.stt}
                onChange={handleChange}
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
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09xxx..."
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="userType" className="block text-gray-700 text-sm font-bold mb-2">
                Loại người dùng
              </label>
              <input
                id="userType"
                type="text"
                disabled
                value={formData.usertype === "internal" ? "Nhân viên nội bộ" : formData.usertype || "Khác"}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="areaConfig" className="block text-gray-700 text-sm font-bold mb-2">
                Xã/Phường
              </label>
              <select
                id="areaConfig"
                value={selectedAreaConfigId}
                onChange={(event) => handleAreaConfigChange(event.target.value)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
                value={selectedArea?.prefix || ""}
                placeholder="Để trống khi chọn Tự do"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-50 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Tên đăng nhập"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="pass" className="block text-gray-700 text-sm font-bold mb-2">
                Mật khẩu mới
              </label>
              <input
                id="pass"
                name="pass"
                type="password"
                value={formData.pass}
                onChange={handleChange}
                placeholder="******"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-blue-600 text-white font-bold py-3 px-4 rounded w-full transition duration-300 ${
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
