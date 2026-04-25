import { IUser } from "./user";

export interface InvoiceInfo {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;

  billing_period: string;

  recordBookCode: string;

  // 💰 Các trường tiền tệ
  currentAmount: string; // Tiền kỳ này
  previousAmount: string; // Tiền kỳ trước
  totalAmount: string; // Tổng tiền (đã có trong Excel)

  // 📅 Trạng thái và ngày tháng
  issueDate: string; // Ngày phát hành
  collectionDate?: string | null; // Ngày thu tiền (nếu có)
  collectionDateAdminEdited?: boolean; // true nếu admin chỉnh ngày thu thủ công
  collectionStatus: "collected" | "not_collected";
  printStatus: "printed" | "not_printed";

  province: string;

  // 👥 Người liên quan
  assignedTo: {
    _id: string;
    fullName: string;
    email: string;
  } | null;

  uploadedBy?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;

  // 🧾 Thông tin file upload (nếu có)
  uploadFileId?: string | null;

  note?: string | null;
  isPaid?: boolean;
  isMissing?: boolean;

  // ⏱ Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserAssigned {
  _id?: string;
  fullName?: string | null;
  email?: string | null;
  username?: string | null;
  province?: string | null;
  role?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
}

export interface IInvoiceSummaryByUser {
  _id?: string;
  assignedTo?: IUserAssigned | IUser | null;
  billing_period: string;
  collectedCount?: number | null;
  notCollectedCount?: number | null;
  collectedTotal?: number | null;
  notCollectedTotal?: number | null;
  paidCount?: number | null;
  paidTotal?: number | null;
}

export interface FetchInvoiceResponse {
  success: boolean;
  data: InvoiceInfo[];
  summary: {
    totalInvoices: number;
    totalAmount: number;
    unassignedInvoices: number;
  };
  pagination: {
    total: number;
    currentPage: number;
    invoicesPerPage: number;
    totalPages: number;
  };
}
