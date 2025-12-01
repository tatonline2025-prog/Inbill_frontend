"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { IUser, IUserResponse } from "@/types/user";

export function useAuth() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get<IUserResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        // console.log(res);
        setUser(res.data.user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        // Token không hợp lệ → xóa luôn
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/login");
  };

  return { user, loading, isAuthenticated, logout };
}
