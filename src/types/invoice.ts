export interface InvoiceInfo {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;

  billing_period: string;

  // 💰 Các trường tiền tệ
  currentAmount: string; // Tiền kỳ này
  previousAmount?: string | null; // Tiền kỳ trước
  totalAmount: string; // Tổng tiền (đã có trong Excel)

  // 📅 Trạng thái và ngày tháng
  issueDate: string; // Ngày phát hành
  collectionDate?: string | null; // Ngày thu tiền (nếu có)
  collectionStatus: "collected" | "not_collected";
  printStatus: "printed" | "not_printed";

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

  // ⏱ Timestamps
  createdAt?: string;
  updatedAt?: string;
}
