import { InvoiceInfo } from "@/types/invoice";
import axios from "axios";

export const fetchallInvoice = async () => {
  const res = await axios.get<InvoiceInfo[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/fetchall`);

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
  totalAmount: string;
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
