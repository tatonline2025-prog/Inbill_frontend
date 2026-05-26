import { IUser } from "./user";

export type InvoiceNumberDuplicateStatus =
  | "same_customer_code_parallel"
  | "updated_customer_info"
  | "duplicate_invoice";

export interface InvoiceInfo {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  billing_period: string;
  recordBookCode: string;
  currentAmount: string;
  previousAmount: string;
  totalAmount: string;
  issueDate: string;
  collectionDate?: string | null;
  collectionDateAdminEdited?: boolean;
  collectionStatus: "collected" | "not_collected";
  printStatus: "printed" | "not_printed";
  province?: string;
  assignedTo: {
    _id: string;
    fullName: string;
    email?: string;
  } | null;
  uploadedBy?: {
    _id: string;
    fullName: string;
    email?: string;
  } | null;
  uploadFileId?: string | null;
  note?: string | null;
  isPaid?: boolean;
  isMissing?: boolean;
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
  duplicateInvoiceNumbers?: string[];
  invoiceNumberStatuses?: Record<string, InvoiceNumberDuplicateStatus>;
  summary: {
    totalInvoices: number;
    totalAmount: number;
    unassignedInvoices: number;
    assignedCustomerCodes?: number;
    unassignedCustomerCodes?: number;
  };
  pagination: {
    total: number;
    currentPage: number;
    invoicesPerPage: number;
    totalPages: number;
  };
}
