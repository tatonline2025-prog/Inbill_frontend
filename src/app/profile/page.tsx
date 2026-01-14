"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiUpdateUser } from "@/services/user.api";
import axios from "axios";
import { VIET_BANKS } from "@/constants/bankqr.constants";

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
    // bankAccount: "",
    // bankName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

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

            <div className="flex-1">
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
                type="pass"
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
