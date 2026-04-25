// constants/invoice.constants.ts

import { InvoiceInfo } from "@/types/invoice";
import { getNowVNDate } from "@/lib/date-vn";

export const PROVINCES = [
  "Đồng Tháp",
  "Tây Ninh",
  "Vĩnh Long",
  "TP Hồ Chí Minh",
  "TP Hà Nội",
  "TP Huế",
  "Quảng Ninh",
  "Cao Bằng",
  "Lạng Sơn",
  "Lai Châu",
  "Điện Biên",
  "Sơn La",
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Tuyên Quang",
  "Lào Cai",
  "Thái Nguyên",
  "Phú Thọ",
  "Bắc Ninh",
  "Hưng Yên",
  "TP Hải Phòng",
  "Ninh Bình",
  "Quảng Trị",
  "TP Đà Nẵng",
  "Quảng Ngãi",
  "Gia Lai",
  "Khánh Hòa",
  "Lâm Đồng",
  "Đắk Lắk",
  "Đồng Nai",
  "TP Cần Thơ",
  "Cà Mau",
  "An Giang",
];

export const generateBillingPeriods = () => {
  const nowVN = getNowVNDate();
  const currentYear = nowVN.getUTCFullYear();
  const currentMonth = nowVN.getUTCMonth();

  return Array.from({ length: 7 }, (_, i) => {
    const offset = i - 3;
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
  { key: "billing_period", label: "Kỳ TT", sortable: true },
  { key: "print", label: "Đã in bill", sortable: false },
  { key: "collect", label: "Đã thu", sortable: false },
  { key: "isPaid", label: "Đã đóng cước", sortable: false },
  { key: "collectionDate", label: "Thời điểm thu", sortable: true },
  { key: "issueDate", label: "Ngày cập nhật", sortable: true },
  { key: "customerPhone", label: "SĐT", sortable: true },
  { key: "note", label: "Ghi chú", sortable: false },
  { key: "actions", label: "Tùy chọn", sortable: false },
];

// Các cột ẩn mặc định khi user mới vào (chưa có cấu hình trong localStorage)
export const DEFAULT_HIDDEN_COLUMNS = ["issueDate", "customerPhone", "note"];
