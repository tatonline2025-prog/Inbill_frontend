// components/invoices/InvoiceTable.tsx

import { InvoiceInfo } from "@/types/invoice";
import { Box, Switch, Typography, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { TABLE_HEADERS } from "@/constants/invoice.constants"; // Import hằng số
import { useEffect, useMemo, useState } from "react";
import { fetchLatestPeriod_API } from "@/services/invoice.api";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import toast from "react-hot-toast";

interface InvoiceTableProps {
  loading: boolean;
  invoices: InvoiceInfo[];
  selectedInvoices: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (checked: boolean, id: string) => void;
  currentPage: number;
  invoicesPerPage: number;
  onToggleStatus: (invoiceId: string, field: "printStatus" | "collectionStatus") => void;
  onToggleIsPaid?: (invoiceId: string) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, invoice: InvoiceInfo) => void;
  sortField: string | null;
  sortDirection: "asc" | "desc" | "none";
  onSort: (field: string) => void;
  showIsPaidColumn?: boolean;
}

export default function InvoiceTable({
  loading,
  invoices,
  selectedInvoices,
  onSelectAll,
  onSelectOne,
  currentPage,
  invoicesPerPage,
  onToggleStatus,
  onToggleIsPaid,
  onMenuOpen,
  sortField,
  sortDirection,
  onSort,
  showIsPaidColumn = true,
}: InvoiceTableProps) {
  const handleSortClick = (field: string) => {
    onSort(field);
  };

  const isAllSelected = selectedInvoices.length === invoices.length && invoices.length > 0;

  const [billingPeriod, setBillingPeriod] = useState("");
  useEffect(() => {
    const fetchLatestPeriod = async () => {
      try {
        const res = await fetchLatestPeriod_API();

        if (res.billing_period) {
          setBillingPeriod(res.billing_period);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchLatestPeriod();
  }, []);

  interface CopyableKey {
    key: Extract<keyof InvoiceInfo, "invoiceNumber" | "totalAmount">;
    label: string;
    sortable: boolean;
  }
  const handleCopyColumn = (data: CopyableKey) => {
    const columnData = invoices.map((invoice) => (invoice[data.key] ?? "").toString()).join("\n");

    navigator.clipboard
      .writeText(columnData)
      .then(() => toast.success(`Đã copy cột ${data.label}!`))
      .catch((err) => console.error("Lỗi copy:", err));
  };

  // Lọc cột (nào hiển thị nào không)
  const visibleHeaders = useMemo(() => {
    if (showIsPaidColumn) return TABLE_HEADERS;
    return TABLE_HEADERS.filter((header) => header.key !== "isPaid");
  }, [showIsPaidColumn]);

  return (
    <Box sx={{ overflowX: "auto" }}>
      <>
        {loading ? (
          <Typography sx={{ p: 4, textAlign: "center" }}>Đang tải dữ liệu hóa đơn...</Typography>
        ) : invoices.length === 0 ? (
          <Typography sx={{ p: 4, textAlign: "center" }}>Không có hóa đơn nào được tìm thấy.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>{/* Bảng hóa đơn */}</Box>
        )}
      </>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb" }}>
            {visibleHeaders.map((header) => {
              return (
                <th
                  key={header.key}
                  onClick={header.key === "collectionDate" ? () => handleSortClick("collectionDate") : undefined}
                  style={{
                    border: "1px solid #e0e0e0",
                    padding: "8px 6px",
                    textAlign: "center", // 1. Căn giữa text của thẻ th
                    backgroundColor: "#f5f5f5",
                    fontSize: "0.75rem",
                    cursor: header.sortable ? "pointer" : "default",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget.querySelector(".copy-btn") as HTMLElement | null;
                    if (btn) btn.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget.querySelector(".copy-btn") as HTMLElement | null;
                    if (btn) btn.style.opacity = "0";
                  }}
                >
                  {/* 2. Dùng Box flex để gom icon và chữ vào 1 hàng + căn giữa */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center", // Căn giữa nội dung trong Flex
                      gap: 0.5, // Khoảng cách giữa chữ và icon
                      width: "100%",
                    }}
                  >
                    {/* Phần Chữ (Label) */}
                    <Box component="span">
                      {header.key === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => onSelectAll(e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                      ) : (
                        header.label
                      )}
                    </Box>

                    {/* Phần Icon (Sort + Copy) - Gom lại thành 1 cụm để không rớt dòng */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {header.key === "collectionDate" && (
                        <span style={{ fontSize: "0.7rem", color: "#666" }}>
                          {sortField === "collectionDate"
                            ? sortDirection === "desc"
                              ? "↓"
                              : sortDirection === "asc"
                              ? "↑"
                              : "↕"
                            : "↕"}
                        </span>
                      )}

                      {(header.key === "invoiceNumber" || header.key === "totalAmount") && (
                        <IconButton
                          className="copy-btn"
                          size="small"
                          style={{ opacity: 0, transition: "opacity 0.2s", padding: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyColumn(header as CopyableKey);
                          }}
                          title="Copy cả cột"
                        >
                          <ContentCopyIcon style={{ fontSize: "14px", color: "#000000ff" }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice, index) => (
            <tr key={invoice._id} style={{ backgroundColor: "#fff" }}>
              {/* Checkbox */}
              <td style={{ border: "1px solid #ddd", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedInvoices.includes(invoice._id)}
                  onChange={(e) => onSelectOne(e.target.checked, invoice._id)}
                />
              </td>
              {/* STT */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem", textAlign: "center" }}>
                {index + 1 + (currentPage - 1) * invoicesPerPage}
              </td>
              {/* Mã KH */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>{invoice.invoiceNumber}</td>
              {/* Tên KH */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>{invoice.customerName}</td>
              {/* Địa Chỉ */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                {invoice.customerAddress}
              </td>
              {/* Kỳ này */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>{invoice.currentAmount}</td>
              {/* Kỳ trước */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                {invoice.previousAmount}
              </td>
              {/* Tổng tiền nợ */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>{invoice.totalAmount}</td>
              {/* SĐT */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>{invoice.customerPhone}</td>
              {/* Ghi chú */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>{invoice.note}</td>
              {/* Nhân viên */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                {invoice.assignedTo?.fullName}
              </td>
              {/* Đã in */}
              <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                <Switch
                  checked={invoice.printStatus === "printed"}
                  onChange={() => onToggleStatus(invoice._id, "printStatus")}
                  color="primary"
                  sx={{ transform: "scale(0.8)" }}
                />
              </td>
              {/* Đã thu */}
              <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                <Switch
                  checked={invoice.collectionStatus === "collected"}
                  onChange={() => onToggleStatus(invoice._id, "collectionStatus")}
                  color="success"
                  sx={{ transform: "scale(0.8)" }}
                />
              </td>

              {showIsPaidColumn && (
                <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                  <Switch
                    checked={invoice.isPaid ?? false}
                    onChange={() => onToggleIsPaid && onToggleIsPaid(invoice._id)}
                    color="success"
                    sx={{ transform: "scale(0.8)" }}
                  />
                </td>
              )}

              {/* Ngày thu */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                {invoice.collectionDate ? new Date(invoice.collectionDate).toLocaleDateString("vi-VN") : "---"}
              </td>
              {/* Ngày giao */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("vi-VN") : "---"}
              </td>
              {/* Kỳ */}
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                {invoice.billing_period}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                {invoice.recordBookCode}
              </td>
              {/* Hành động */}
              <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                <IconButton size="small" onClick={(e) => onMenuOpen(e, invoice)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}
