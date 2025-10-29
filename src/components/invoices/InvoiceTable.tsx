// components/invoices/InvoiceTable.tsx

import { InvoiceInfo } from "@/types/invoice";
import { Box, Switch, Typography, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { TABLE_HEADERS } from "@/constants/invoice.constants"; // Import hằng số

interface InvoiceTableProps {
  loading: boolean;
  invoices: InvoiceInfo[];
  selectedInvoices: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (checked: boolean, id: string) => void;
  currentPage: number;
  invoicesPerPage: number;
  onToggleStatus: (invoiceId: string, field: "printStatus" | "collectionStatus") => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, invoice: InvoiceInfo) => void;
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
  onMenuOpen,
}: InvoiceTableProps) {
  if (loading) {
    return <Typography sx={{ p: 4, textAlign: "center" }}>Đang tải dữ liệu hóa đơn...</Typography>;
  }

  if (invoices.length === 0) {
    return <Typography sx={{ p: 4, textAlign: "center" }}>Không có hóa đơn nào được tìm thấy.</Typography>;
  }

  const isAllSelected = selectedInvoices.length === invoices.length && invoices.length > 0;

  return (
    <Box sx={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 900,
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb" }}>
            {TABLE_HEADERS.map((header) => (
              <th
                key={header.key}
                style={{
                  border: "1px solid #e0e0e0",
                  padding: "8px 6px",
                  textAlign: "left",
                  backgroundColor: "#f5f5f5",
                  fontSize: "0.75rem",
                  cursor: header.sortable ? "pointer" : "default",
                  userSelect: "none",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {header.key === "checkbox" ? (
                    <input type="checkbox" checked={isAllSelected} onChange={(e) => onSelectAll(e.target.checked)} />
                  ) : (
                    header.label
                  )}
                </Box>
              </th>
            ))}
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
