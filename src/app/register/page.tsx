// frontend/src/app/register/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/auth.api";
import Header from "@/components/Header";

export default function RegisterPage() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const fullName = `${lastName} ${firstName}`.trim();

    try {
      const res = await register(name, email, password, fullName);

      // console.log(res);

      setMessage({ type: "success", text: "Đăng ký thành công! Đang chuyển hướng..." });

      // Chuyển hướng sau 2 giây
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.log(err);
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
    <div className="min-h-screen flex items-start justify-center pt-10">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Đăng Ký Tài Khoản</h1>

        {message && <div className={`p-3 border rounded-lg mb-4 ${getMessageClass()}`}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-2">
            <div>
              <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">
                Họ
              </label>
              <input
                type="text"
                id="lastName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Họ của bạn"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">
                Tên
              </label>
              <input
                type="text"
                id="firstName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Tên của bạn"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nhập tên đăng nhập của bạn"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nhập email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nhập mật khẩu"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Đang xử lý..." : "Đăng Ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
