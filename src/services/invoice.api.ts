import { FetchInvoiceResponse, IInvoiceSummaryByUser, InvoiceInfo } from "@/types/invoice";
import axios from "axios";

export const fetchallInvoice = async (
  currentPage: number,
  invoicesPerPage: number,
  printStatus?: "printed" | "not_printed",
  collectionStatus?: "collected" | "not_collected",
  assignedUserId?: string, // 👈 Thêm dòng này
  province?: string,
  searchInvoiceNumber?: string,
  userprovince?: string,
  sortField?: string | null,
  sortDirection?: "asc" | "desc"
) => {
  // console.log(currentPage, invoicesPerPage, printStatus, collectionStatus, assignedUserId, province, userprovince);

  const res = await axios.get<FetchInvoiceResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/fetchall`, {
    params: {
      currentPage,
      invoicesPerPage,
      printStatus,
      collectionStatus,
      assignedUserId,
      province,
      searchInvoiceNumber,
      userprovince,
      sortField,
      sortDirection,
    },
  });

  return res;
};

export const invoiceSummary = async (userId?: string) => {
  const res = await axios.get<IInvoiceSummaryByUser[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/summary`, {
    params: { userId },
  });

  return res;
};

export const fetchInvoiceByUser = async (token: string) => {
  const res = await axios.get<InvoiceInfo[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/fetchallbyuser`, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
};

export const fetchInvoiceByUserMonth = async (token: string) => {
  const res = await axios.get<InvoiceInfo[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/fetchallbyusermonth`,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
};

export const handleToggle_API = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/${invoiceId}/toggle`,
      { field },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
  }
};

export const createInvoice_API = async (newInvoice: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  billing_period: string;
  currentAmount: string;
  assignedTo: string;
}) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/creatnew`,
      { newInvoice },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
  }
};

export const deleteInvoice_API = async (invoiceNumber: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const res = await axios.delete(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/delete/${invoiceNumber}`,

      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Xoá hoá đơn thất bại thất bại:", err);
  }
};

// Xoá tất cả hoá đơn theo kỳ
export const deleteInvoicesByBillingPeriod_API = async (billing_period: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/deleteByBillingPeriod`, {
    params: { billing_period },
    headers: { Authorization: `Bearer ${token}` },
  });

  return res;
};
