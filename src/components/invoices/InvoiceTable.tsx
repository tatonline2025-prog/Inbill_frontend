// components/invoices/InvoiceTable.tsx

import { InvoiceInfo } from "@/types/invoice";
import {
  Box,
  Switch,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { TABLE_HEADERS } from "@/constants/invoice.constants"; // Import hằng số
import { useEffect, useMemo, useState } from "react";
import { fetchLatestPeriod_API } from "@/services/invoice.api";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import toast from "react-hot-toast";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

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
  onFetchAllData?: () => Promise<InvoiceInfo[]>;
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
  onFetchAllData,
}: InvoiceTableProps) {
  const defaultColumns = TABLE_HEADERS.map((h) => h.key);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [isCopyingAll, setIsCopyingAll] = useState(false);

  // Load cấu hình từ localStorage khi mới vào
  useEffect(() => {
    const savedCols = localStorage.getItem("invoice_visible_columns");
    if (savedCols) {
      setVisibleColumns(JSON.parse(savedCols));
    }
  }, []);

  // Hàm lưu cấu hình
  const handleToggleColumn = (key: string) => {
    const newColumns = visibleColumns.includes(key)
      ? visibleColumns.filter((c) => c !== key) // Bỏ chọn
      : [...visibleColumns, key]; // Chọn thêm

    setVisibleColumns(newColumns);
    localStorage.setItem("invoice_visible_columns", JSON.stringify(newColumns));
  };

  // Hàm kiểm tra cột có được hiện không (Dùng cho cả Header và Body)
  const isColVisible = (key: string) => {
    // Checkbox và Action luôn hiện để thao tác
    if (key === "checkbox" || key === "action") return true;
    // IsPaid phụ thuộc vào props bên ngoài nữa
    if (key === "isPaid" && !showIsPaidColumn) return false;

    return visibleColumns.includes(key);
  };

  const handleSortClick = (field: string) => {
    onSort(field);
  };

  const isAllSelected = selectedInvoices.length === invoices.length && invoices.length > 0;

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

  const handleCopyAllData = async (key: string, label: string) => {
    if (!onFetchAllData) {
      toast.error("Chưa cấu hình tính năng này");
      return;
    }

    setIsCopyingAll(true);
    const toastId = toast.loading(`Đang tải toàn bộ dữ liệu cột ${label}...`);

    try {
      const allData = await onFetchAllData();

      if (!allData || allData.length === 0) {
        toast.dismiss(toastId);
        toast.error("Không có dữ liệu nào.");
        return;
      }

      const columnData = allData.map((invoice) => (invoice[key as keyof InvoiceInfo] ?? "").toString()).join("\n");

      await navigator.clipboard.writeText(columnData);

      toast.dismiss(toastId);
      toast.success(`Đã copy ${allData.length} dòng!`);
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Lỗi khi lấy dữ liệu.");
    } finally {
      setIsCopyingAll(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* THANH CÔNG CỤ: NÚT ẨN/HIỆN CỘT */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, px: 1 }}>
        <Button
          startIcon={<ViewColumnIcon />}
          variant="outlined"
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Ẩn/Hiện cột
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ style: { maxHeight: 300, width: 250 } }}
        >
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: "gray" }}>
            Chọn cột hiển thị
          </Typography>
          {TABLE_HEADERS.map((header) => {
            // Không cho ẩn checkbox
            if (header.key === "checkbox") return null;
            if (header.key === "stt") return null;
            if (header.key === "actions") return null;

            return (
              <MenuItem key={header.key} onClick={() => handleToggleColumn(header.key)} dense>
                <Checkbox checked={visibleColumns.includes(header.key)} size="small" />
                <ListItemText primary={header.label} />
              </MenuItem>
            );
          })}
        </Menu>
      </Box>

      {/* THÔNG BÁO LOADING / EMPTY */}
      {loading ? (
        <Typography sx={{ p: 4, textAlign: "center" }}>Đang tải dữ liệu hóa đơn...</Typography>
      ) : invoices.length === 0 ? (
        <Typography sx={{ p: 4, textAlign: "center" }}>Không có hóa đơn nào được tìm thấy.</Typography>
      ) : null}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8rem",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb" }}>
            {/* Lọc header dựa trên visibleColumns */}
            {TABLE_HEADERS.map((header) => {
              if (!isColVisible(header.key)) return null; // ẨN HEADER

              return (
                <th
                  key={header.key}
                  onClick={header.key === "collectionDate" ? () => handleSortClick("collectionDate") : undefined}
                  style={{
                    border: "1px solid #e0e0e0",
                    padding: "8px 4px",
                    textAlign: "center",
                    backgroundColor: "#f5f5f5",
                    fontWeight: 600,
                    cursor: header.sortable ? "pointer" : "default",
                    userSelect: "none",
                    verticalAlign: "middle",
                    whiteSpace: "nowrap",
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                    <span>
                      {header.key === "checkbox" ? (
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => onSelectAll(e.target.checked)}
                        />
                      ) : (
                        header.label
                      )}
                    </span>

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
                      >
                        <ContentCopyIcon style={{ fontSize: "12px", color: "#555" }} />
                      </IconButton>
                    )}

                    {header.key === "invoiceNumber" && (
                      <IconButton
                        size="small"
                        sx={{ padding: "2px" }}
                        onClick={() => handleCopyAllData(header.key, header.label)}
                        disabled={isCopyingAll}
                      >
                        {isCopyingAll ? (
                          <CircularProgress size={14} color="primary" />
                        ) : (
                          <CloudDownloadIcon style={{ fontSize: "16px", color: "#1976d2" }} />
                        )}
                      </IconButton>
                    )}
                  </Box>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice, index) => (
            <tr key={invoice._id} style={{ backgroundColor: "#fff" }}>
              {/* Checkbox: Luôn hiện */}
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "4px" }}>
                <input
                  type="checkbox"
                  checked={selectedInvoices.includes(invoice._id)}
                  onChange={(e) => onSelectOne(e.target.checked, invoice._id)}
                />
              </td>

              {/* STT: Coi như một cột riêng mặc định hiện */}
              <td style={{ border: "1px solid #ddd", padding: "4px", textAlign: "center" }}>
                {index + 1 + (currentPage - 1) * invoicesPerPage}
              </td>

              {/* --- CÁC CỘT DỮ LIỆU: KIỂM TRA isColVisible TRƯỚC KHI RENDER --- */}

              {isColVisible("invoiceNumber") && (
                <td style={{ border: "1px solid #ddd", padding: "6px" }}>{invoice.invoiceNumber}</td>
              )}

              {isColVisible("customerName") && (
                <td style={{ border: "1px solid #ddd", padding: "6px" }}>{invoice.customerName}</td>
              )}

              {isColVisible("customerAddress") && (
                <td style={{ border: "1px solid #ddd", padding: "4px", wordBreak: "break-word" }}>
                  {invoice.customerAddress}
                </td>
              )}

              {isColVisible("currentAmount") && (
                <td style={{ border: "1px solid #ddd", padding: "4px", textAlign: "right" }}>
                  {invoice.currentAmount}
                </td>
              )}

              {isColVisible("previousAmount") && (
                <td style={{ border: "1px solid #ddd", padding: "4px", textAlign: "right" }}>
                  {invoice.previousAmount}
                </td>
              )}

              {isColVisible("totalAmount") && (
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "4px",
                    textAlign: "right",
                    fontWeight: "bold",
                    color: invoice.isPaid
                      ? "#2e7d32" // Màu Xanh lá (Đã đóng cước)
                      : Number(invoice.previousAmount) > 0
                      ? "#d32f2f" // Màu Đỏ (Chưa trả + Có nợ cũ)
                      : "#f9a825", // Màu Vàng đậm/Cam (Chưa trả + Không nợ cũ)
                  }}
                >
                  {invoice.totalAmount}
                </td>
              )}

              {isColVisible("customerPhone") && (
                <td style={{ border: "1px solid #ddd", padding: "4px", wordBreak: "break-word" }}>
                  {invoice.customerPhone}
                </td>
              )}

              {isColVisible("note") && (
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "4px",
                    wordBreak: "break-word",
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                  }}
                >
                  {invoice.note}
                </td>
              )}

              {isColVisible("assignedTo") && (
                <td style={{ border: "1px solid #ddd", padding: "4px" }}>{invoice.assignedTo?.fullName}</td>
              )}

              {/* Các Switch */}
              {isColVisible("print") && (
                <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
                  <Switch
                    checked={invoice.printStatus === "printed"}
                    onChange={() => onToggleStatus(invoice._id, "printStatus")}
                    size="small"
                    sx={{ transform: "scale(0.8)" }}
                  />
                </td>
              )}

              {isColVisible("collect") && (
                <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
                  <Switch
                    checked={invoice.collectionStatus === "collected"}
                    onChange={() => onToggleStatus(invoice._id, "collectionStatus")}
                    color="success"
                    size="small"
                    sx={{ transform: "scale(0.8)" }}
                  />
                </td>
              )}

              {/* isPaid đã được check bên trong hàm isColVisible rồi */}
              {isColVisible("isPaid") && (
                <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
                  <Switch
                    checked={invoice.isPaid ?? false}
                    onChange={() => onToggleIsPaid && onToggleIsPaid(invoice._id)}
                    color="success"
                    size="small"
                    sx={{ transform: "scale(0.8)" }}
                  />
                </td>
              )}

              {isColVisible("collectionDate") && (
                <td style={{ border: "1px solid #ddd", padding: "4px", fontSize: "0.75rem" }}>
                  {invoice.collectionDate ? new Date(invoice.collectionDate).toLocaleDateString("vi-VN") : "-"}
                </td>
              )}

              {isColVisible("issueDate") && (
                <td style={{ border: "1px solid #ddd", padding: "4px", fontSize: "0.75rem" }}>
                  {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("vi-VN") : "-"}
                </td>
              )}

              {isColVisible("billing_period") && (
                <td style={{ border: "1px solid #ddd", padding: "4px" }}>{invoice.billing_period}</td>
              )}

              {isColVisible("recordBookCode") && (
                <td style={{ border: "1px solid #ddd", padding: "4px", whiteSpace: "nowrap" }}>
                  {invoice.recordBookCode}
                </td>
              )}

              {/* Action 3 chấm: Luôn hiện (hoặc check key action nếu có trong headers) */}
              <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
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
