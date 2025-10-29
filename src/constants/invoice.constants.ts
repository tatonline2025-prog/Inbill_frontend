// constants/invoice.constants.ts

import { InvoiceInfo } from "@/types/invoice";

export const PROVINCES = [
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
  "TP Hồ Chí Minh",
  "Đồng Nai",
  "Tây Ninh",
  "TP Cần Thơ",
  "Vĩnh Long",
  "Đồng Tháp",
  "Cà Mau",
  "An Giang",
];

export const generateBillingPeriods = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    return `${month}/${currentYear}`;
  });
};

export const TABLE_HEADERS: {
  key: keyof InvoiceInfo | "checkbox" | "stt" | "actions" | "totalDebt" | "print" | "collect";
  label: string;
  sortable: boolean;
}[] = [
  { key: "checkbox", label: "✓", sortable: false },
  { key: "stt", label: "STT", sortable: false },
  { key: "invoiceNumber", label: "Mã Khách Hàng", sortable: true },
  { key: "customerName", label: "Tên Khách Hàng", sortable: true },
  { key: "customerAddress", label: "Địa Chỉ", sortable: true },
  { key: "currentAmount", label: "Kỳ này", sortable: true },
  { key: "previousAmount", label: "Kỳ trước", sortable: true },
  { key: "totalDebt", label: "Tổng tiền nợ", sortable: false }, // Đổi key từ totalAmount
  { key: "customerPhone", label: "SĐT", sortable: true },
  { key: "note", label: "Ghi chú", sortable: false },
  { key: "assignedTo", label: "Nhân viên phụ trách", sortable: false },
  { key: "print", label: "Đã in bill", sortable: false },
  { key: "collect", label: "Đã thu", sortable: false },
  { key: "collectionDate", label: "Ngày thu", sortable: true },
  { key: "issueDate", label: "Ngày giao", sortable: true },
  { key: "billing_period", label: "Kỳ", sortable: true },
  { key: "actions", label: "Hành động", sortable: false },
];
