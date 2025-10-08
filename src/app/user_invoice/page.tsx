"use client";

import { useEffect, useState } from "react";
import { fetchInvoiceByUser, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { useAuth } from "@/context/AuthContext";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [selectedDate, setSelectedDate] = useState("");

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");

  const { isAuthenticated } = useAuth();

  // --- Gọi API khi component mount ---
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) setError("Chưa đăng nhập");

        const res = await fetchInvoiceByUser(token as string);

        const data = res.data; // nếu backend trả trực tiếp mảng
        // const data = res.data.result; // nếu backend trả { result: [...] }

        setInvoices(data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
        setError("Không thể tải dữ liệu hóa đơn. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // --- Hàm xuất Excel ---
  const handleExport = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcel`;
  };

  const handleExportPrinted = () => {
    if (!selectedDate) {
      alert("Vui lòng chọn ngày trước khi xuất!");
      return;
    }

    // Gửi ngày dưới dạng query param
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcelPrinted?date=${selectedDate}`;
  };

  // --- Lọc hóa đơn theo trạng thái ---
  const filteredInvoices = invoices.filter((inv) => {
    const matchPrint =
      filterPrint === "all"
        ? true
        : filterPrint === "printed"
        ? inv.printStatus === "printed"
        : inv.printStatus !== "printed";

    const matchCollection =
      filterCollection === "all"
        ? true
        : filterCollection === "collected"
        ? inv.collectionStatus === "collected"
        : inv.collectionStatus !== "collected";

    return matchPrint && matchCollection;
  });

  // --- Tính toán dữ liệu trang hiện tại ---
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);

  // --- Tổng số trang sau khi lọc ---
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // --- Hàm đổi trang ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleToggle = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
    try {
      // Gọi API cập nhật trạng thái
      const res = await handleToggle_API(invoiceId, field);

      // if (!res.ok) throw new Error("Cập nhật thất bại");

      // Nếu bạn đang lưu danh sách invoice trong state, cập nhật lại UI:
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === invoiceId
            ? {
                ...inv,
                [field]:
                  field === "printStatus"
                    ? inv.printStatus === "printed"
                      ? "not_printed"
                      : "printed"
                    : inv.collectionStatus === "collected"
                    ? "not_collected"
                    : "collected",
                // Nếu là cập nhật trạng thái thu tiền thì xử lý thêm collectionDate
                collectionDate:
                  field === "collectionStatus"
                    ? inv.collectionStatus === "collected"
                      ? null // nếu vừa chuyển sang "chưa thu" thì xóa ngày
                      : new Date().toISOString() // nếu vừa chuyển sang "đã thu" thì cập nhật ngày hiện tại
                    : inv.collectionDate, // còn nếu không phải field này thì giữ nguyên
              }
            : inv
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // --- Trạng thái hiển thị ---
  if (!isAuthenticated) <p style={{ padding: "2rem" }}>Vui lòng đăng nhập...</p>;
  if (loading) return <p style={{ padding: "2rem" }}>Đang tải dữ liệu hóa đơn...</p>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Danh Sách Hóa Đơn
      </Typography>

      {/* --- Thanh điều khiển trên cùng --- */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <div className="flex gap-2">
          {/* Nút Xuất Excel */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={invoices.length === 0}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Xuất ra Excel toàn bộ
          </Button>

          <TextField
            label="Chọn ngày thu"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            sx={{ minWidth: 180 }}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportPrinted}
            disabled={invoices.length === 0}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              backgroundColor: "#16a34a", // xanh lá
              "&:hover": {
                backgroundColor: "#15803d", // xanh lá đậm khi hover
              },
            }}
          >
            Xuất ra Excel đã thu
          </Button>
        </div>

        {/* Chọn số lượng hiển thị */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="invoices-per-page-label">Hiển thị</InputLabel>
          <Select
            labelId="invoices-per-page-label"
            value={invoicesPerPage}
            label="Hiển thị"
            onChange={(e) => setInvoicesPerPage(Number(e.target.value))}
          >
            <MenuItem value={15}>15</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="filter-print-label">Trạng thái in bill</InputLabel>
          <Select
            labelId="filter-print-label"
            value={filterPrint}
            label="Trạng thái in bill"
            onChange={(e) => {
              setFilterPrint(e.target.value);
              setCurrentPage(1);
            }}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="printed">Đã in</MenuItem>
            <MenuItem value="notPrinted">Chưa in</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="filter-collection-label">Trạng thái thu tiền</InputLabel>
          <Select
            labelId="filter-collection-label"
            value={filterCollection}
            label="Trạng thái thu tiền"
            onChange={(e) => {
              setFilterCollection(e.target.value);
              setCurrentPage(1);
            }}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="collected">Đã thu</MenuItem>
            <MenuItem value="notCollected">Chưa thu</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <p>Đang có tổng {filteredInvoices.length} hoá đơn</p>

      {/* --- Bảng dữ liệu --- */}
      {invoices.length === 0 ? (
        <Typography>Không có hóa đơn nào được tìm thấy.</Typography>
      ) : (
        <>
          <Paper sx={{ overflow: "hidden" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  {[
                    "Số Hóa Đơn",
                    "Tên Khách Hàng",
                    "SĐT",
                    "Địa Chỉ",
                    "Kỳ Thanh Toán",
                    "Tổng tiền",
                    "Nhân viên phụ trách",
                    "Đã in bill",
                    "Đã thu",
                    "Ngày thu",
                    "Ngày giao",
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        border: "1px solid #e0e0e0",
                        padding: "10px",
                        textAlign: "left",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.invoiceNumber}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.customerName}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.customerPhone}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.customerAddress}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.billing_period}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.totalAmount}</td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{invoice.assignedTo.fullName}</td>

                    {/* Toggle in bill */}
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <Switch
                        checked={invoice.printStatus === "printed"}
                        onChange={() => handleToggle(invoice._id, "printStatus")}
                        color="primary"
                      />
                    </td>

                    {/* Toggle thu tiền */}
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <Switch
                        checked={invoice.collectionStatus === "collected"}
                        onChange={() => handleToggle(invoice._id, "collectionStatus")}
                        color="success"
                      />
                    </td>

                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {invoice.collectionDate ? new Date(invoice.collectionDate).toLocaleDateString("vi-VN") : ""}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("vi-VN") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>

          {/* --- Phân trang --- */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Pagination
              count={totalPages} // tổng số trang
              page={currentPage} // trang hiện tại
              onChange={(event, value) => handlePageChange(value)} // gọi hàm đổi trang
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </>
      )}
    </Box>
  );
}
