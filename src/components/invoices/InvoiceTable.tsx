import { Fragment, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import toast from "react-hot-toast";

import { InvoiceInfo, InvoiceNumberDuplicateStatus } from "@/types/invoice";
import { TABLE_HEADERS, DEFAULT_HIDDEN_COLUMNS } from "@/constants/invoice.constants";
import { formatDateVN, formatDateTimeVN } from "@/lib/date-vn";
import { useAuth } from "@/hooks/useAuth";
import { updateCollectionDate_API } from "@/services/invoice.api";

interface InvoiceTableProps {
  loading: boolean;
  invoices: InvoiceInfo[];
  duplicateInvoiceNumbers?: string[];
  invoiceNumberStatuses?: Record<string, InvoiceNumberDuplicateStatus>;
  selectedInvoices: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (checked: boolean, id: string) => void;
  currentPage: number;
  invoicesPerPage: number;
  onToggleStatus: (invoiceId: string, field: "printStatus" | "collectionStatus") => void;
  onToggleIsPaid?: (invoiceId: string) => void;
  onMenuOpen: (event: MouseEvent<HTMLElement>, invoice: InvoiceInfo) => void;
  sortField: string | null;
  sortDirection: "asc" | "desc" | "none";
  onSort: (field: string) => void;
  showIsPaidColumn?: boolean;
  onFetchAllData?: () => Promise<InvoiceInfo[]>;
}

type CopyableHeaderKey = Extract<keyof InvoiceInfo, "invoiceNumber" | "totalAmount">;

const getSortIndicator = (activeField: string | null, field: string, direction: "asc" | "desc" | "none") => {
  if (activeField !== field) return "↕";
  if (direction === "desc") return "↓";
  if (direction === "asc") return "↑";
  return "↕";
};

export default function InvoiceTable({
  loading,
  invoices,
  duplicateInvoiceNumbers,
  invoiceNumberStatuses,
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
  const defaultColumns = TABLE_HEADERS.map((header) => String(header.key)).filter(
    (key) => !DEFAULT_HIDDEN_COLUMNS.includes(key)
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [isCopyingAll, setIsCopyingAll] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [savingDateId, setSavingDateId] = useState<string | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const dataColumnKeys = useMemo(
    () =>
      TABLE_HEADERS.map((header) => String(header.key)).filter(
        (key) => key !== "checkbox" && key !== "stt" && key !== "actions"
      ),
    []
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(dataColumnKeys);

  useEffect(() => {
    const savedOrder = localStorage.getItem("invoice_column_order_v1");
    if (!savedOrder) return;

    try {
      const parsed = JSON.parse(savedOrder) as string[];
      const valid = parsed.filter((key) => dataColumnKeys.includes(key));
      const missing = dataColumnKeys.filter((key) => !valid.includes(key));
      setColumnOrder([...valid, ...missing]);
    } catch {
      // Bỏ qua dữ liệu localStorage lỗi.
    }
  }, [dataColumnKeys]);

  useEffect(() => {
    const savedColumns = localStorage.getItem("invoice_visible_columns_v2");
    if (!savedColumns) return;

    try {
      setVisibleColumns(JSON.parse(savedColumns));
    } catch {
      // Bỏ qua dữ liệu localStorage lỗi.
    }
  }, []);

  const moveColumn = (key: string, direction: -1 | 1) => {
    setColumnOrder((previous) => {
      const currentIndex = previous.indexOf(key);
      if (currentIndex === -1) return previous;

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= previous.length) return previous;

      const next = [...previous];
      [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
      localStorage.setItem("invoice_column_order_v1", JSON.stringify(next));
      return next;
    });
  };

  const headerByKey = useMemo(() => {
    const headers: Record<string, (typeof TABLE_HEADERS)[number]> = {};
    TABLE_HEADERS.forEach((header) => {
      headers[header.key] = header;
    });
    return headers;
  }, []);

  const orderedHeaders = useMemo(() => {
    const headers = [
      headerByKey.checkbox,
      headerByKey.stt,
      ...columnOrder.map((key) => headerByKey[key]).filter(Boolean),
      headerByKey.actions,
    ];
    return headers.filter(Boolean);
  }, [columnOrder, headerByKey]);

  const duplicateInvoiceNumbersSet = useMemo(() => {
    if (duplicateInvoiceNumbers && duplicateInvoiceNumbers.length > 0) {
      return new Set(duplicateInvoiceNumbers.map((value) => value.toString().trim()));
    }

    const counter = new Map<string, number>();
    invoices.forEach((invoice) => {
      const invoiceNumber = (invoice.invoiceNumber || invoice.recordBookCode || "").toString().trim();
      if (!invoiceNumber) return;
      counter.set(invoiceNumber, (counter.get(invoiceNumber) || 0) + 1);
    });

    const duplicates = new Set<string>();
    counter.forEach((count, invoiceNumber) => {
      if (count > 1) duplicates.add(invoiceNumber);
    });
    return duplicates;
  }, [duplicateInvoiceNumbers, invoices]);

  const isDuplicateInvoice = (invoice: InvoiceInfo) => {
    const invoiceNumber = (invoice.invoiceNumber || invoice.recordBookCode || "").toString().trim();
    return invoiceNumber ? duplicateInvoiceNumbersSet.has(invoiceNumber) : false;
  };

  const getInvoiceNumberStatus = (invoice: InvoiceInfo): InvoiceNumberDuplicateStatus | null => {
    const invoiceNumber = (invoice.invoiceNumber || invoice.recordBookCode || "").toString().trim();
    return invoiceNumber ? invoiceNumberStatuses?.[invoiceNumber] ?? null : null;
  };

  const getInvoiceNumberPresentation = (invoice: InvoiceInfo) => {
    const status = getInvoiceNumberStatus(invoice);

    if (status === "duplicate_invoice") {
      return {
        color: "#b45309",
        fontWeight: 700,
        title:
          "Trùng hóa đơn: cùng Mã KH, cùng kỳ thanh toán và nội dung giống nhau sau khi bổ sung dữ liệu còn thiếu.",
      };
    }

    if (status === "updated_customer_info") {
      return {
        color: "#f97316",
        fontWeight: 700,
        title:
          "Giống mã KH nhưng khác tên khách hàng, địa chỉ hoặc số trạm; đây là nhóm cập nhật thông tin mới.",
      };
    }

    if (status === "same_customer_code_parallel" || isDuplicateInvoice(invoice)) {
      return {
        color: "#ef4444",
        fontWeight: 700,
        title:
          "Giống mã KH nhưng khác kỳ thanh toán, số tiền hoặc người phụ trách; đây là các hóa đơn song song của cùng Mã KH.",
      };
    }

    return {
      color: undefined,
      fontWeight: undefined,
      title: undefined,
    };
  };

  const handleToggleColumn = (key: string) => {
    const nextColumns = visibleColumns.includes(key)
      ? visibleColumns.filter((columnKey) => columnKey !== key)
      : [...visibleColumns, key];

    setVisibleColumns(nextColumns);
    localStorage.setItem("invoice_visible_columns_v2", JSON.stringify(nextColumns));
  };

  const isColumnVisible = (key: string) => {
    if (key === "checkbox" || key === "actions") return true;
    if (key === "isPaid" && !showIsPaidColumn) return false;
    return visibleColumns.includes(key);
  };

  const isAllSelected = selectedInvoices.length === invoices.length && invoices.length > 0;

  const handleCopyColumn = (key: CopyableHeaderKey, label: string) => {
    const columnData = invoices.map((invoice) => (invoice[key] ?? "").toString()).join("\n");
    navigator.clipboard
      .writeText(columnData)
      .then(() => toast.success(`Đã sao chép cột ${label}.`))
      .catch((error) => console.error("Lỗi sao chép:", error));
  };

  const handleCopyAllData = async (key: string, label: string) => {
    if (!onFetchAllData) {
      toast.error("Tính năng này chưa được cấu hình.");
      return;
    }

    setIsCopyingAll(true);
    const loadingToast = toast.loading(`Đang tải toàn bộ dữ liệu cột ${label}...`);

    try {
      const allData = await onFetchAllData();
      if (!allData || allData.length === 0) {
        toast.dismiss(loadingToast);
        toast.error("Không có dữ liệu nào.");
        return;
      }

      const columnData = allData.map((invoice) => (invoice[key as keyof InvoiceInfo] ?? "").toString()).join("\n");
      await navigator.clipboard.writeText(columnData);
      toast.dismiss(loadingToast);
      toast.success(`Đã sao chép ${allData.length} dòng.`);
    } catch (error) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error("Không thể lấy dữ liệu để sao chép.");
    } finally {
      setIsCopyingAll(false);
    }
  };

  const handleSaveCollectionDate = async (invoice: InvoiceInfo, newDate: string) => {
    setSavingDateId(invoice._id);

    try {
      await updateCollectionDate_API(invoice._id, newDate || null);
      invoice.collectionDate = newDate ? new Date(`${newDate}T12:00:00.000Z`).toISOString() : null;
      invoice.collectionDateAdminEdited = !!newDate;
      invoice.collectionStatus = newDate ? "collected" : "not_collected";
      toast.success("Đã cập nhật ngày thu.");
      setEditingDateId(null);
    } catch (error) {
      console.error(error);
      toast.error("Lưu ngày thu thất bại.");
    } finally {
      setSavingDateId(null);
    }
  };

  const renderCell = (key: string, invoice: InvoiceInfo): ReactNode => {
    switch (key) {
      case "invoiceNumber": {
        const presentation = getInvoiceNumberPresentation(invoice);
        return (
          <td
            style={{
              border: "1px solid #ddd",
              padding: "6px",
              color: presentation.color,
              fontWeight: presentation.fontWeight,
            }}
            title={presentation.title}
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
              color: invoice.isPaid ? "#2e7d32" : Number(invoice.previousAmount) > 0 ? "#d32f2f" : "#f9a825",
            }}
          >
            {invoice.totalAmount}
          </td>
        );
      case "customerName":
        return <td style={{ border: "1px solid #ddd", padding: "6px" }}>{invoice.customerName}</td>;
      case "customerAddress":
        return (
          <td
            style={{ border: "1px solid #ddd", padding: "4px", wordBreak: "break-word", maxWidth: 240, minWidth: 180 }}
          >
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
              onChange={() => onToggleIsPaid?.(invoice._id)}
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
                const defaultValue = invoice.collectionDate
                  ? new Date(invoice.collectionDate).toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10);

                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="date"
                      defaultValue={defaultValue}
                      disabled={savingDateId === invoice._id}
                      style={{ fontSize: "0.75rem", padding: "2px 4px" }}
                      onBlur={(event) => handleSaveCollectionDate(invoice, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") (event.target as HTMLInputElement).blur();
                        if (event.key === "Escape") setEditingDateId(null);
                      }}
                      autoFocus
                    />
                  </span>
                );
              }

              return (
                <span
                  role="button"
                  title={adminEdited ? "Đơn bổ sung, nhấp để sửa ngày thu." : "Nhấp để chỉnh ngày thu."}
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
        return <td style={{ border: "1px solid #ddd" }} />;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        slotProps={{ paper: { style: { maxHeight: 560, width: 230 } } }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 0.5, color: "gray" }}>
          Chọn và sắp xếp cột
        </Typography>
        {columnOrder.map((key, index) => {
          const header = headerByKey[key];
          if (!header) return null;

          return (
            <MenuItem key={key} dense sx={{ py: 0, minHeight: 28, gap: 0 }} disableRipple>
              <IconButton
                size="small"
                disabled={index === 0}
                onClick={(event) => {
                  event.stopPropagation();
                  moveColumn(key, -1);
                }}
                sx={{ p: 0.25 }}
                title="Đưa lên trên"
              >
                <ArrowUpwardIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton
                size="small"
                disabled={index === columnOrder.length - 1}
                onClick={(event) => {
                  event.stopPropagation();
                  moveColumn(key, 1);
                }}
                sx={{ p: 0.25, mr: 0.5 }}
                title="Đưa xuống dưới"
              >
                <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <Box
                onClick={() => handleToggleColumn(key)}
                sx={{ display: "flex", alignItems: "center", flex: 1, cursor: "pointer" }}
              >
                <Checkbox checked={visibleColumns.includes(key)} size="small" sx={{ p: 0.25, mr: 0.5 }} />
                <ListItemText primary={header.label} primaryTypographyProps={{ fontSize: "0.8rem" }} />
              </Box>
            </MenuItem>
          );
        })}
      </Menu>

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
              {orderedHeaders.map((header) => {
                if (!isColumnVisible(header.key)) return null;

                const isDataColumn = header.key !== "checkbox" && header.key !== "stt" && header.key !== "actions";

                return (
                  <th
                    key={header.key}
                    onClick={isDataColumn ? () => onSort(header.key) : undefined}
                    style={{
                      border: "1px solid #e0e0e0",
                      padding: "8px 4px",
                      textAlign: "center",
                      backgroundColor: "#f5f5f5",
                      fontWeight: 600,
                      cursor: isDataColumn ? "pointer" : "default",
                      userSelect: "none",
                      verticalAlign: "middle",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(event) => {
                      const button = event.currentTarget.querySelector(".copy-btn") as HTMLElement | null;
                      if (button) button.style.opacity = "1";
                    }}
                    onMouseLeave={(event) => {
                      const button = event.currentTarget.querySelector(".copy-btn") as HTMLElement | null;
                      if (button) button.style.opacity = "0";
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <span>
                        {header.key === "checkbox" ? (
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={(event) => onSelectAll(event.target.checked)}
                          />
                        ) : (
                          header.label
                        )}
                      </span>

                      {header.key === "actions" && (
                        <IconButton
                          size="small"
                          title="Ẩn hoặc hiện cột"
                          sx={{ p: 0.25 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setColumnMenuAnchor(event.currentTarget);
                          }}
                        >
                          <ViewColumnIcon style={{ fontSize: "16px", color: "#1976d2" }} />
                        </IconButton>
                      )}

                      {isDataColumn && (
                        <span style={{ fontSize: "0.7rem", color: sortField === header.key ? "#1976d2" : "#bbb" }}>
                          {getSortIndicator(sortField, header.key, sortDirection)}
                        </span>
                      )}

                      {(header.key === "invoiceNumber" || header.key === "totalAmount") && (
                        <IconButton
                          className="copy-btn"
                          size="small"
                          style={{ opacity: 0, transition: "opacity 0.2s", padding: 2 }}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCopyColumn(header.key as CopyableHeaderKey, header.label);
                          }}
                        >
                          <ContentCopyIcon style={{ fontSize: "12px", color: "#555" }} />
                        </IconButton>
                      )}

                      {header.key === "invoiceNumber" && (
                        <IconButton
                          size="small"
                          sx={{ padding: "2px" }}
                          onClick={(event) => {
                            event.stopPropagation();
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
              const invoicePresentation = getInvoiceNumberPresentation(invoice);

              return (
                <tr
                  key={invoice._id}
                  style={{
                    backgroundColor: isMissingRow ? "#ffebee" : "#fff",
                    color: isMissingRow ? "#d32f2f" : "inherit",
                  }}
                >
                  <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "4px" }}>
                    {!isMissingRow && (
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice._id)}
                        onChange={(event) => onSelectOne(event.target.checked, invoice._id)}
                      />
                    )}
                  </td>

                  <td style={{ border: "1px solid #ddd", padding: "4px", textAlign: "center" }}>
                    {index + 1 + (currentPage - 1) * invoicesPerPage}
                  </td>

                  {isMissingRow ? (
                    <>
                      {isColumnVisible("invoiceNumber") && (
                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "6px",
                            fontWeight: "bold",
                            color: invoicePresentation.color,
                          }}
                          title={invoicePresentation.title}
                        >
                          {invoice.invoiceNumber || invoice.recordBookCode}
                        </td>
                      )}
                      {isColumnVisible("customerName") && (
                        <td
                          style={{ border: "1px solid #ddd", padding: "6px", fontStyle: "italic" }}
                          colSpan={Math.max(
                            1,
                            columnOrder.filter(
                              (key) => isColumnVisible(key) && key !== "invoiceNumber" && key !== "customerName"
                            ).length
                          )}
                        >
                          {invoice.customerName}
                        </td>
                      )}
                    </>
                  ) : (
                    columnOrder
                      .filter((key) => isColumnVisible(key))
                      .map((key) => <Fragment key={key}>{renderCell(key, invoice)}</Fragment>)
                  )}

                  <td style={{ border: "1px solid #ddd", padding: "2px", textAlign: "center" }}>
                    {!isMissingRow && (
                      <IconButton size="small" onClick={(event) => onMenuOpen(event, invoice)}>
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
