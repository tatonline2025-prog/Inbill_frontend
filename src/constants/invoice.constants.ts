import { InvoiceInfo } from "@/types/invoice";
import { createBillingPeriodWindow, getDefaultBillingPeriod } from "@/lib/billing-period";

export const generateBillingPeriods = () => createBillingPeriodWindow(getDefaultBillingPeriod(), 1, 1);

export const TABLE_HEADERS: {
  key: keyof InvoiceInfo | "checkbox" | "stt" | "actions" | "totalAmount" | "print" | "collect";
  label: string;
  sortable: boolean;
}[] = [
  { key: "checkbox", label: "✓", sortable: false },
  { key: "stt", label: "STT", sortable: false },
  { key: "invoiceNumber", label: "Mã KH", sortable: true },
  { key: "currentAmount", label: "Kỳ này", sortable: true },
  { key: "previousAmount", label: "Kỳ trước", sortable: true },
  { key: "totalAmount", label: "Tổng tiền", sortable: false },
  { key: "customerName", label: "Tên", sortable: true },
  { key: "customerAddress", label: "Địa chỉ", sortable: true },
  { key: "recordBookCode", label: "Trạm", sortable: false },
  { key: "assignedTo", label: "Người phụ trách", sortable: false },
  { key: "billing_period", label: "Kỳ TT", sortable: true },
  { key: "print", label: "Đã in hóa đơn", sortable: false },
  { key: "collect", label: "Đã thu", sortable: false },
  { key: "isPaid", label: "Đã đóng cước", sortable: false },
  { key: "collectionDate", label: "Thời điểm thu", sortable: true },
  { key: "issueDate", label: "Ngày cập nhật", sortable: true },
  { key: "customerPhone", label: "SĐT", sortable: true },
  { key: "note", label: "Ghi chú", sortable: false },
  { key: "actions", label: "Tùy chọn", sortable: false },
];

export const DEFAULT_HIDDEN_COLUMNS = ["issueDate", "customerPhone", "note"];
