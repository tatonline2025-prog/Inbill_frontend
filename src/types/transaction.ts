import { IUser } from "./user";

export interface ITransaction {
  _id: string;

  amount: number;
  finalAmount: number;

  // Khóa ngoại (IDs)
  creatorId: string | IUser; // CTV tạo
  typeId: string | ITransactionType; // Loại giao dịch

  // Khóa ngoại tùy chọn
  approvedByAdminId: string | null; // Admin đã duyệt (hoặc null)
  paymentBankId: string | ITransactionPaymentBank | null; // Bank thanh toán (hoặc null)

  // Trạng thái và thời gian
  status: "PENDING" | "APPROVED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ITransactionType {
  _id: string;
  name: string;
  description: string;
  discountPercent: number;
  bankId: string | ITransactionPaymentBank;
  createdBy: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface ITransactionFilterParams {
  searchName?: string;
  status?: "PENDING" | "APPROVED" | "CANCELLED" | string;
  startDate?: string;
  endDate?: string;
}

export interface ITransactionPaymentBank {
  _id: string;
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  branch: string;
}
