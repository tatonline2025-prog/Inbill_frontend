import { IUser } from "./user";

export interface ITransaction {
  _id: string;

  amount: number;
  finalAmount: number;

  discountPercent: number;

  // Khóa ngoại (IDs)
  creatorId: string | IUser; // CTV tạo
  typeId: string | ITransactionType; // Loại giao dịch

  // Khóa ngoại tùy chọn
  approvedByAdminId: string | null; // Admin đã duyệt (hoặc null)
  paymentSourceId: string | ITransactionPaymentBank | null; // Hình thức thanh toán

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
  bankName: string;
}
