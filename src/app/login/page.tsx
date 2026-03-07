"use client";

import { FormEvent, useState } from "react";
import axios from "axios";
import { login } from "@/services/auth.api";
import { getApiBaseUrl } from "@/lib/api-base-url";

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const apiUrl = getApiBaseUrl();
    if (!apiUrl) {
      setMessage({ type: "error", text: "Loi cau hinh API." });
      setIsLoading(false);
      return;
    }

    try {
      const res = await login(userName, password);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setMessage({ type: "success", text: "Dang nhap thanh cong. Dang chuyen huong..." });

      setTimeout(() => {
        const role = res.data.user.role;
        window.location.href = role === "admin" ? "/home" : "/userhome";
      }, 500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const serverMessage =
          typeof err.response?.data?.message === "string" ? err.response.data.message : undefined;

        if (status === 401) {
          setMessage({ type: "error", text: "Sai ten dang nhap hoac mat khau." });
        } else if (status === 404) {
          setMessage({ type: "error", text: "Khong tim thay API dang nhap. Kiem tra BE/FE local." });
        } else if (status === 500) {
          setMessage({ type: "error", text: serverMessage || "Server login dang loi noi bo (HTTP 500)." });
        } else if (!err.response) {
          setMessage({ type: "error", text: "Khong ket noi duoc toi server." });
        } else {
          setMessage({ type: "error", text: serverMessage || `Dang nhap that bai (HTTP ${status}).` });
        }
      } else {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Co loi khong xac dinh khi dang nhap.",
        });
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
    <div className="min-h-screen flex items-start justify-center pt-10">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-600">Dang Nhap</h1>

        {message && <div className={`p-3 border rounded-lg mb-4 ${getMessageClass()}`}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="userName" className="block text-gray-700 text-sm font-bold mb-2">
              Ten dang nhap
            </label>
            <input
              type="text"
              id="userName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nhap ten dang nhap"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Mat khau
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Nhap mat khau"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
            }`}
          >
            {isLoading ? "Dang xu ly..." : "Dang Nhap"}
          </button>
        </form>
      </div>
    </div>
  );
}
