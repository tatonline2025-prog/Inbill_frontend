"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { fetchInvoiceByUser, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";

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
import { excelUp } from "@/services/excel.api";
import { getErrorMessage } from "../users/page";
import { useAuth } from "@/hooks/useAuth";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [selectedDate, setSelectedDate] = useState("");

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");

  const [totalAmount, setTotalAmount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const { isAuthenticated, user } = useAuth();

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

    const matchDate =
      selectedDate === "" || filterCollection !== "collected"
        ? true
        : inv.collectionDate && new Date(inv.collectionDate).toISOString().slice(0, 10) === selectedDate;
    return matchPrint && matchCollection && matchDate;
  });

  // --- Tính toán dữ liệu trang hiện tại ---
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);

  // --- Tổng số trang sau khi lọc ---
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // Tính toán tổng số tiền theo bộ lọc
  useEffect(() => {
    const total = filteredInvoices.reduce((sum, inv) => {
      const amount = parseFloat(inv.totalAmount.toString().replace(/[^\d.-]/g, ""));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    setTotalAmount(total);
  }, [filteredInvoices]);

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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, userId: string) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ type: "error", text: "Vui lòng chọn file Excel (.xlsx hoặc .xls)." });
        return;
      }

      setIsLoading(true);
      setMessage({ type: "info", text: `Đang tải file lên cho user: ${userId}...` });

      const formData = new FormData();
      formData.append("excelFile", selectedFile);
      formData.append("userId", userId); // ✅ gửi kèm id user

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Bạn chưa đăng nhập!");

        const response = await excelUp(formData, token);
        console.log("Upload thành công:", response.data);

        setMessage({ type: "success", text: `Đã tải file cho user ${userId} thành công.` });
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: getErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {/* Nút Xuất Excel */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={invoices.length === 0}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontSize: { xs: "0.7rem", sm: "0.875rem" }, // responsive font
              minWidth: { xs: "120px", sm: "160px" }, // co gọn trên mobile
            }}
          >
            Xuất ra Excel toàn bộ
          </Button>

          <TextField
            label="Chọn ngày thu"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            sx={{
              minWidth: { xs: 120, sm: 180 },
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
            }}
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
              backgroundColor: "#16a34a",
              "&:hover": { backgroundColor: "#15803d" },
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
              minWidth: { xs: "120px", sm: "160px" },
            }}
          >
            Xuất ra Excel đã thu
          </Button>

          <input
            type="file"
            id={`fileUpload-${user?._id || "me"}`}
            accept=".xlsx, .xls"
            disabled={isLoading}
            onChange={(e) => handleFileChange(e, user?._id || "")}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
          />
        </Box>

        {/* Chọn số lượng hiển thị */}
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 100, sm: 120 },
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
          <InputLabel id="invoices-per-page-label">Hiển thị</InputLabel>
          <Select
            labelId="invoices-per-page-label"
            value={invoicesPerPage}
            label="Hiển thị"
            onChange={(e) => {
              setInvoicesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <MenuItem value={15}>15</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
            <MenuItem value={200}>200</MenuItem>
            <MenuItem value={300}>300</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* --- Bộ lọc trạng thái --- */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 140, sm: 160 },
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
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

        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 140, sm: 160 },
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
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

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-around",
          alignItems: "center",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          borderRadius: 2,
          p: 2,
          mb: 3,
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Số mã khách hàng đang phụ trách
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#16a34a" }}>
            {filteredInvoices.length}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Tổng giá trị hoá đơn
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#dc2626" }}>
            {totalAmount.toLocaleString("vi-VN")} đ
          </Typography>
        </Box>
      </Box>

      {/* --- Bảng dữ liệu --- */}
      {invoices.length === 0 ? (
        <Typography>Không có hóa đơn nào được tìm thấy.</Typography>
      ) : (
        <>
          {/* Thêm scroll ngang */}
          <Box sx={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
                fontSize: "0.875rem", // default ~14px
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  {[
                    "Mã Khách Hàng",
                    "Tên Khách Hàng",
                    "SĐT",
                    "Địa Chỉ",
                    "Kỳ Thanh Toán",
                    "Tổng Tiền",
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
                        padding: "8px 6px",
                        textAlign: "left",
                        backgroundColor: "#f5f5f5",
                        fontSize: "0.75rem", // header nhỏ hơn dòng dữ liệu
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((invoice) => (
                  <tr key={invoice._id} style={{ backgroundColor: "#fff" }}>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.invoiceNumber}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.customerName}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.customerPhone}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.customerAddress}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.billing_period}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.totalAmount}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.assignedTo.fullName}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                      <Switch
                        checked={invoice.printStatus === "printed"}
                        onChange={() => handleToggle(invoice._id, "printStatus")}
                        color="primary"
                        sx={{ transform: "scale(0.8)" }} // thu nhỏ switch
                      />
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                      <Switch
                        checked={invoice.collectionStatus === "collected"}
                        onChange={() => handleToggle(invoice._id, "collectionStatus")}
                        color="success"
                        sx={{ transform: "scale(0.8)" }}
                      />
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.collectionDate ? new Date(invoice.collectionDate).toLocaleDateString("vi-VN") : "---"}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                      {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("vi-VN") : "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

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
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => handlePageChange(value)}
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
