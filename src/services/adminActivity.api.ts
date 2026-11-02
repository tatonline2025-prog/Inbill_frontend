import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-base-url";

export interface AdminActivityItem {
  _id: string;
  actorName: string;
  actorUsername: string;
  title: string;
  message: string;
  customerCode?: string;
  count: number;
  createdAt: string;
  readBy: string[];
  telegramStatus?: "not_requested" | "awaiting_config" | "pending" | "sending" | "sent" | "failed";
  changes: { field: string; label: string; before: string; after: string }[];
  details: { fileName?: string; billingPeriod?: string; totalAmount?: string; inserted?: number; modified?: number; customerCodes?: string[] };
}
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
export async function fetchAdminActivities(page = 1, limit = 20) {
  const response = await axios.get<{ items: AdminActivityItem[]; total: number; unreadCount: number }>(
    `${getApiBaseUrl()}/api/invoices/admin-activity`, { headers: headers(), params: { page, limit } }
  );
  return response.data;
}
export async function markAdminActivityRead(id: string) {
  await axios.patch(`${getApiBaseUrl()}/api/invoices/admin-activity/${id}/read`, {}, { headers: headers() });
}
export async function retryAdminActivityTelegram(id: string) {
  await axios.post(`${getApiBaseUrl()}/api/invoices/admin-activity/${id}/telegram-retry`, {}, { headers: headers() });
}
