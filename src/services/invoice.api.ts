import { FetchInvoiceResponse, IInvoiceSummaryByUser, InvoiceInfo } from "@/types/invoice";
import axios from "axios";

export const fetchallInvoice = async (
  currentPage: number,
  invoicesPerPage: number,
  printStatus?: "printed" | "not_printed",
  collectionStatus?: "collected" | "not_collected",
  assignedUserId?: string,
  province?: string,
  customerCode?: string,
  stationCode?: string,
  userprovince?: string,
  sortField?: string | null,
  sortDirection?: "asc" | "desc",
  isPaid?: boolean
) => {
  const token = localStorage.getItem("token");

  const res = await axios.get<FetchInvoiceResponse>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/fetchall`, {
    params: {
      currentPage,
      invoicesPerPage,
      printStatus,
      collectionStatus,
      assignedUserId,
      province,
      customerCode,
      stationCode,
      userprovince,
      sortField,
      sortDirection,
      isPaid,
    },
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
};

export const fetchInvoiceBylist = async (codes?: string[]) => {
  const token = localStorage.getItem("token");

  console.log(codes);

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/fetchbylist`,
    {
      codes,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

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

export const handleToggleIsPaid_API = async (invoiceId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  try {
    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/${invoiceId}/toggleispaid`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
    throw err;
  }
};

export const handleToggleIsPaidList_API = async (data: { invoiceNumbers: string[] }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/mark-paid-list`,
      { data },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
    throw err;
  }
};

export const createInvoice_API = async (newInvoice: {
  customerName: string;
  customerAddress: string;
  billing_period: string;
  currentAmount: string;
  recordBookCode: string;
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
    throw err;
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

interface LatestPeriodResponse {
  billing_period: string;
}
export const fetchLatestPeriod_API = async () => {
  const res = await axios.get<LatestPeriodResponse>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/latest-period`
  );
  return res.data;
};

export const fetchInvoicesForCopyAPI = async (
  filterPrint: string,
  filterCollection: string,
  filterAssignedUser: string,
  isPaidFilter?: boolean,
  selectedProvince?: string
) => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/forcopy`, {
    params: {
      filterPrint,
      filterCollection,
      filterAssignedUser,
      isPaidFilter,
      selectedProvince,
    },
  });

  // console.log(res);

  return res.data;
};

export const updateInvoice = async (
  formData: Partial<Omit<InvoiceInfo, "assignedTo">> & { assignedTo?: string },
  invoiceNumber: string
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/update/${invoiceNumber}`,
    {
      formData,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};
