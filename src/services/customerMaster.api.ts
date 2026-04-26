import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-base-url";

export interface CustomerMasterItem {
  _id: string;
  invoiceNumber: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  province?: string;
  recordBookCode?: string;
  assignedTo?: { _id: string; fullName?: string; username?: string } | string | null;
  lastBillingPeriod?: string;
  seenCount?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Chưa đăng nhập");
  return { Authorization: `Bearer ${token}` };
};

export const fetchCustomerMaster_API = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  assignedTo?: string;
  province?: string;
}) => {
  const res = await axios.get<{ items: CustomerMasterItem[]; total: number; page: number; limit: number }>(
    `${getApiBaseUrl()}/api/customers`,
    { headers: authHeaders(), params }
  );
  return res.data;
};

export const updateCustomerMaster_API = async (id: string, payload: Partial<CustomerMasterItem> & { assignedTo?: string | null }) => {
  const res = await axios.put<{ item: CustomerMasterItem }>(
    `${getApiBaseUrl()}/api/customers/${id}`,
    payload,
    { headers: authHeaders() }
  );
  return res.data.item;
};

export const deleteCustomerMaster_API = async (id: string) => {
  const res = await axios.delete(`${getApiBaseUrl()}/api/customers/${id}`, { headers: authHeaders() });
  return res.data;
};

export const createInvoiceFromMaster_API = async (
  id: string,
  body: { totalAmount: number | string; previousAmount?: number | string; currentAmount?: number | string; billing_period: string }
) => {
  const res = await axios.post(`${getApiBaseUrl()}/api/customers/${id}/create-invoice`, body, { headers: authHeaders() });
  return res.data;
};

export const syncCustomerMasterFromInvoices_API = async () => {
  const res = await axios.post(`${getApiBaseUrl()}/api/customers/sync-from-invoices`, {}, { headers: authHeaders() });
  return res.data;
};
