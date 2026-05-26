import { InvoiceInfo } from "@/types/invoice";
import { getNowVNDate } from "@/lib/date-vn";

export const generateBillingPeriods = () => {
  const nowVN = getNowVNDate();
  const currentYear = nowVN.getUTCFullYear();
  const currentMonth = nowVN.getUTCMonth();

  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 3;
    const date = new Date(Date.UTC(currentYear, currentMonth + offset, 1));
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${month}/${year}`;
  });
};

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
  { key: "billing_period", label: "Kỳ thanh toán", sortable: true },
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
