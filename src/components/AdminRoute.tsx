"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // gì hiện khi redirect hoặc chưa load
}

export default function AdminRoute({ children, fallback = null }: AdminRouteProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/user_invoice"); // redirect nếu không phải admin
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return fallback; // có thể show spinner
  }

  return <>{children}</>;
}
