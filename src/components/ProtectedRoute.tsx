"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // danh sách role/userType được phép
  fallback?: React.ReactNode; // gì hiện khi redirect hoặc chưa load
  redirectTo?: string; // redirect mặc định nếu không đủ quyền
}

export default function ProtectedRoute({
  children,
  allowedRoles = ["admin"], // mặc định chỉ admin
  fallback = null,
  redirectTo = "/user_invoice_v2",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const hasAccess = allowedRoles.includes(user.role) || allowedRoles.includes(user.usertype ?? "");
      if (!hasAccess) {
        router.replace(redirectTo);
      }
    }
  }, [user, loading, router, allowedRoles, redirectTo]);

  // show fallback nếu user chưa load hoặc không có quyền
  if (loading) return fallback;
  if (!user) return fallback;

  const hasAccess = allowedRoles.includes(user.role) || allowedRoles.includes(user.usertype ?? "");

  if (!hasAccess) return fallback;

  return <>{children}</>;
}
