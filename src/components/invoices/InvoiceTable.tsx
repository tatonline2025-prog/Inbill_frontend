// components/invoices/InvoiceTable.tsx

import { InvoiceInfo } from "@/types/invoice";
import {
  Box,
  Switch,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { TABLE_HEADERS, DEFAULT_HIDDEN_COLUMNS } from "@/constants/invoice.constants"; // Import hằng số
import { formatDateVN, formatDateTimeVN } from "@/lib/date-vn";
import { Fragment, useEffect, useMemo, useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import toast from "react-hot-toast";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { useAuth } from "@/hooks/useAuth";
import { updateCollectionDate_API } from "@/services/invoice.api";

interface InvoiceTableProps {
  loading: boolean;
  invoices: InvoiceInfo[];
  duplicateInvoiceNumbers?: string[];
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
  duplicateInvoiceNumbers,
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
  const defaultColumns = TABLE_HEADERS
    .map((h) => h.key)
    .filter((k) => !DEFAULT_HIDDEN_COLUMNS.includes(k as string));

  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Thứ tự các cột dữ liệu (không bao gồm checkbox/stt/actions — những cột đó luôn cố định đầu/cuối)
  const dataColumnKeys = useMemo(
    () => TABLE_HEADERS.map((h) => h.key).filter((k) => k !== "checkbox" && k !== "stt" && k !== "actions"),
    []
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(dataColumnKeys);

  useEffect(() => {
    const saved = localStorage.getItem("invoice_column_order_v1");
    if (saved) {
      try {
        const arr = JSON.parse(saved) as string[];
        const valid = arr.filter((k) => dataColumnKeys.includes(k));
        const missing = dataColumnKeys.filter((k) => !valid.includes(k));
        setColumnOrder([...valid, ...missing]);
      } catch {}
    }
  }, [dataColumnKeys]);

  const moveColumn = (key: string, dir: -1 | 1) => {
    setColumnOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      localStorage.setItem("invoice_column_order_v1", JSON.stringify(next));
      return next;
    });
  };

  const headerByKey = useMemo(() => {
    const m: Record<string, (typeof TABLE_HEADERS)[number]> = {};
    TABLE_HEADERS.forEach((h) => {
      m[h.key] = h;
    });
    return m;
  }, []);

  // Thứ tự hiển thị của toàn bộ cột (không bỏ qua hidden — isColVisible sẽ lọc khi render)
  const orderedHeaders = useMemo(() => {
    const list = [
      headerByKey["checkbox"],
      headerByKey["stt"],
      ...columnOrder.map((k) => headerByKey[k]).filter(Boolean),
      headerByKey["actions"],
    ];
    return list.filter(Boolean);
  }, [columnOrder, headerByKey]);

  const [isCopyingAll, setIsCopyingAll] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [savingDateId, setSavingDateId] = useState<string | null>(null);

  const handleSaveCollectionDate = async (invoice: InvoiceInfo, newDate: string) => {
    setSavingDateId(invoice._id);
    try {
      await updateCollectionDate_API(invoice._id, newDate || null);
      // Cập nhật local UI ngay
      invoice.collectionDate = newDate ? new Date(`${newDate}T12:00:00.000Z`).toISOString() : null;
      invoice.collectionDateAdminEdited = !!newDate;
      invoice.collectionStatus = newDate ? "collected" : "not_collected";
      toast.success("Đã cập nhật ngày thu.");
      setEditingDateId(null);
    } catch (e) {
      console.error(e);
      toast.error("Lưu ngày thu thất bại.");
    } finally {
      setSavingDateId(null);
    }
  };

  // Load cấu hình từ localStorage khi mới vào (key v2 để reset cấu hình cũ)
  useEffect(() => {
    const savedCols = localStorage.getItem("invoice_visible_columns_v2");
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
    localStorage.setItem("invoice_visible_columns_v2", JSON.stringify(newColumns));
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

  // ✅ Phát hiện các mã hóa đơn trùng (tồn tại song song nhiều bản ghi)
  // Ưu tiên dữ liệu từ BE (toàn DB), fallback đếm trên trang hiện tại.
  const duplicateInvoiceNumbersSet = useMemo(() => {
    if (duplicateInvoiceNumbers && duplicateInvoiceNumbers.length > 0) {
      return new Set(duplicateInvoiceNumbers.map((s) => s.toString().trim()));
    }
    const counter = new Map<string, number>();
    invoices.forEach((inv) => {
      const key = (inv.invoiceNumber || inv.recordBookCode || "").toString().trim();
      if (!key) return;
      counter.set(key, (counter.get(key) || 0) + 1);
    });
    const dup = new Set<string>();
    counter.forEach((v, k) => {
      if (v > 1) dup.add(k);
    });
    return dup;
  }, [invoices, duplicateInvoiceNumbers]);

  const isDuplicateInvoice = (invoice: InvoiceInfo) => {
    const key = (invoice.invoiceNumber || invoice.recordBookCode || "").toString().trim();
    return key ? duplicateInvoiceNumbersSet.has(key) : false;
  };

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

  // Render một ô dữ liệu theo key cột (để có thể đổi thứ tự dễ)
  const renderCell = (key: string, invoice: InvoiceInfo): React.ReactNode => {
    switch (key) {
      case "invoiceNumber": {
        const dup = isDuplicateInvoice(invoice);
        return (
          <td
            style={{
              border: "1px solid #ddd",
              padding: "6px",
              color: dup ? "#ef4444" : undefined,
              fontWeight: dup ? 600 : undefined,
            }}
            title={dup ? "Mã KH này tồn tại nhiều hóa đơn song song (khác kỳ TT hoặc khác người phụ trách) — cần xử lý đặc biệt." : undefined}
          >
            {invoice.invoiceNumber || invoice.recordBookCode}
          </td>
        );
      }
      case "currentAmount":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", textAlign: "right" }}>
            {invoice.currentAmount}
          </td>
        );
      case "previousAmount":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", textAlign: "right" }}>
            {invoice.previousAmount}
          </td>
        );
      case "totalAmount":
        return (
          <td
            style={{
              border: "1px solid #ddd",
              padding: "4px",
              textAlign: "right",
              fontWeight: "bold",
              color: invoice.isPaid
                ? "#2e7d32"
                : Number(invoice.previousAmount) > 0
                ? "#d32f2f"
                : "#f9a825",
            }}
          >
            {invoice.totalAmount}
          </td>
        );
      case "customerName":
        return <td style={{ border: "1px solid #ddd", padding: "6px" }}>{invoice.customerName}</td>;
      case "customerAddress":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", wordBreak: "break-word", maxWidth: 240, minWidth: 180 }}>
            {invoice.customerAddress}
          </td>
        );
      case "recordBookCode":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", whiteSpace: "nowrap" }}>
            {invoice.recordBookCode}
          </td>
        );
      case "assignedTo":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", whiteSpace: "nowrap", minWidth: 140 }}>
            {invoice.assignedTo?.fullName}
          </td>
        );
      case "billing_period":
        return <td style={{ border: "1px solid #ddd", padding: "4px" }}>{invoice.billing_period}</td>;
      case "print":
        return (
          <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
            <Switch
              checked={invoice.printStatus === "printed"}
              onChange={() => onToggleStatus(invoice._id, "printStatus")}
              size="small"
              sx={{ transform: "scale(0.8)" }}
            />
          </td>
        );
      case "collect":
        return (
          <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
            <Switch
              checked={invoice.collectionStatus === "collected"}
              onChange={() => onToggleStatus(invoice._id, "collectionStatus")}
              color="success"
              size="small"
              sx={{ transform: "scale(0.8)" }}
            />
          </td>
        );
      case "isPaid":
        return (
          <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
            <Switch
              checked={invoice.isPaid ?? false}
              onChange={() => onToggleIsPaid && onToggleIsPaid(invoice._id)}
              color="success"
              size="small"
              sx={{ transform: "scale(0.8)" }}
            />
          </td>
        );
      case "collectionDate":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
            {(() => {
              const adminEdited = invoice.collectionDateAdminEdited === true;
              const display = invoice.collectionDate
                ? adminEdited
                  ? formatDateVN(invoice.collectionDate)
                  : formatDateTimeVN(invoice.collectionDate)
                : "-";
              if (!isAdmin) return display;
              if (editingDateId === invoice._id) {
                const defaultVal = invoice.collectionDate
                  ? new Date(invoice.collectionDate).toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10);
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="date"
                      defaultValue={defaultVal}
                      disabled={savingDateId === invoice._id}
                      style={{ fontSize: "0.75rem", padding: "2px 4px" }}
                      onBlur={(e) => handleSaveCollectionDate(invoice, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingDateId(null);
                      }}
                      autoFocus
                    />
                  </span>
                );
              }
              return (
                <span
                  role="button"
                  title={adminEdited ? "Đơn bổ sung (admin chỉnh ngày) — nhấp để sửa" : "Nhấp để chỉnh ngày thu"}
                  onClick={() => setEditingDateId(invoice._id)}
                  style={{
                    cursor: "pointer",
                    color: adminEdited ? "#2563eb" : undefined,
                    fontWeight: adminEdited ? 600 : undefined,
                    textDecoration: "underline dotted",
                  }}
                >
                  {display}
                </span>
              );
            })()}
          </td>
        );
      case "issueDate":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", fontSize: "0.75rem" }}>
            {formatDateVN(invoice.issueDate)}
          </td>
        );
      case "customerPhone":
        return (
          <td style={{ border: "1px solid #ddd", padding: "4px", wordBreak: "break-word" }}>
            {invoice.customerPhone}
          </td>
        );
      case "note":
        return (
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
        );
      default:
        return <td style={{ border: "1px solid #ddd" }}></td>;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Menu Ẩn/Hiện cột (anchor được set từ header cột Tùy chọn) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { style: { maxHeight: 560, width: 230 } } }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 0.5, color: "gray" }}>
          Chọn & sắp xếp cột
        </Typography>
        {columnOrder.map((key, idx) => {
          const header = headerByKey[key];
          if (!header) return null;
          return (
            <MenuItem
              key={key}
              dense
              sx={{ py: 0, minHeight: 28, gap: 0 }}
              disableRipple
            >
              <IconButton
                size="small"
                disabled={idx === 0}
                onClick={(e) => { e.stopPropagation(); moveColumn(key, -1); }}
                sx={{ p: 0.25 }}
                title="Lên trên"
              >
                <ArrowUpwardIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                size="small"
                disabled={idx === columnOrder.length - 1}
                onClick={(e) => { e.stopPropagation(); moveColumn(key, 1); }}
                sx={{ p: 0.25, mr: 0.5 }}
                title="Xuống dưới"
              >
                <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <Box
                onClick={() => handleToggleColumn(key)}
                sx={{ display: "flex", alignItems: "center", flex: 1, cursor: "pointer" }}
              >
                <Checkbox
                  checked={visibleColumns.includes(key)}
                  size="small"
                  sx={{ p: 0.25, mr: 0.5 }}
                />
                <ListItemText
                  primary={header.label}
                  primaryTypographyProps={{ fontSize: "0.8rem" }}
                />
              </Box>
            </MenuItem>
          );
        })}
      </Menu>

      {/* THÔNG BÁO LOADING / EMPTY */}
      {loading ? (
        <Typography sx={{ p: 4, textAlign: "center" }}>Đang tải dữ liệu hóa đơn...</Typography>
      ) : invoices.length === 0 ? (
        <Typography sx={{ p: 4, textAlign: "center" }}>Không có hóa đơn nào được tìm thấy.</Typography>
      ) : null}

      <Box sx={{ width: "100%", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 1400,
          borderCollapse: "collapse",
          fontSize: "0.8rem",
          tableLayout: "auto",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb" }}>
            {/* Lọc & sắp xếp header theo orderedHeaders */}
            {orderedHeaders.map((header) => {
              if (!isColVisible(header.key)) return null; // ẨN HEADER

              const isDataCol = header.key !== "checkbox" && header.key !== "stt" && header.key !== "actions";

              return (
                <th
                  key={header.key}
                  onClick={isDataCol ? () => handleSortClick(header.key) : undefined}
                  style={{
                    border: "1px solid #e0e0e0",
                    padding: "8px 4px",
                    textAlign: "center",
                    backgroundColor: "#f5f5f5",
                    fontWeight: 600,
                    cursor: isDataCol ? "pointer" : "default",
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

                    {header.key === "actions" && (
                      <IconButton
                        size="small"
                        title="Ẩn/Hiện cột"
                        sx={{ p: 0.25 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnchorEl(e.currentTarget);
                        }}
                      >
                        <ViewColumnIcon style={{ fontSize: "16px", color: "#1976d2" }} />
                      </IconButton>
                    )}

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

                    {/* Indicator sắp xếp cho các cột dữ liệu khác */}
                    {isDataCol && header.key !== "collectionDate" && (
                      <span style={{ fontSize: "0.7rem", color: sortField === header.key ? "#1976d2" : "#bbb" }}>
                        {sortField === header.key
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAllData(header.key, header.label);
                        }}
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
          {invoices.map((invoice, index) => {
            const isMissingRow = invoice.isMissing === true;

            return (
              <tr
                key={invoice._id}
                style={{
                  backgroundColor: isMissingRow ? "#ffebee" : "#fff",
                  color: isMissingRow ? "#d32f2f" : "inherit",
                }}
              >
                {/* Checkbox: Luôn hiện */}
                <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "4px" }}>
                  {/* Ẩn checkbox nếu là dòng missing (vì không thao tác được) */}
                  {!isMissingRow && (
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice._id)}
                      onChange={(e) => onSelectOne(e.target.checked, invoice._id)}
                    />
                  )}
                </td>

                {/* STT: Coi như một cột riêng mặc định hiện */}
                <td style={{ border: "1px solid #ddd", padding: "4px", textAlign: "center" }}>
                  {index + 1 + (currentPage - 1) * invoicesPerPage}
                </td>

                {/* --- CÁC CỘT DỮ LIỆU: render theo thứ tự columnOrder --- */}
                {isMissingRow ? (
                  <>
                    {isColVisible("invoiceNumber") && (
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: "6px",
                          fontWeight: "bold",
                          color: isDuplicateInvoice(invoice) ? "#ef4444" : undefined,
                        }}
                        title={isDuplicateInvoice(invoice) ? "Mã KH này tồn tại nhiều hóa đơn song song." : undefined}
                      >
                        {invoice.invoiceNumber || invoice.recordBookCode}
                      </td>
                    )}
                    {isColVisible("customerName") && (
                      <td
                        style={{ border: "1px solid #ddd", padding: "6px", fontStyle: "italic" }}
                        colSpan={Math.max(
                          1,
                          columnOrder.filter((k) => isColVisible(k) && k !== "invoiceNumber" && k !== "customerName").length
                        )}
                      >
                        {invoice.customerName}
                      </td>
                    )}
                  </>
                ) : (
                  columnOrder
                    .filter((k) => isColVisible(k))
                    .map((k) => <Fragment key={k}>{renderCell(k, invoice)}</Fragment>)
                )}

                {/* Action 3 chấm: Luôn hiện (hoặc check key action nếu có trong headers) */}
                <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
                  {!isMissingRow && (
                    <IconButton size="small" onClick={(e) => onMenuOpen(e, invoice)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </Box>
    </Box>
  );
}
