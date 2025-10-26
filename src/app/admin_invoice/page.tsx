"use client";

import { useEffect, useMemo, useState } from "react"; // --- SỬA ĐỔI ---
import { deleteInvoice_API, fetchallInvoice, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import AdminRoute from "@/components/AdminRoute";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Switch,
  TextField,
  Typography,
  IconButton,
  Menu,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"; // --- THÊM MỚI ---
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"; // --- THÊM MỚI ---
import AddIcon from "@mui/icons-material/Add";
import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";

import MoreVertIcon from "@mui/icons-material/MoreVert";

import toast from "react-hot-toast";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import UploadInvoiceWithProvinceDialog from "@/components/UploadInvoiceWithProvinceDialog";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [userData, setUserData] = useState<IUser[]>([]);

  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(1);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(1);

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");

  const [openUploadWithProvince, setOpenUploadWithProvince] = useState(false);

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const [totalAmountInfo, setTotalAmountInfo] = useState(0);

  const [openAddDialog, setOpenAddDialog] = useState(false);

  const provinces = [
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

  // ✅ Xác định kỳ hóa đơn
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();

  if (month === 0) {
    month = 12;
    year -= 1;
  }

  const billing_period = `${month.toString().padStart(2, "0")}/${year}`;

  // --- State quản lý menu hành động ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: InvoiceInfo) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  // --- Gọi API khi component mount ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchallUser();

        const filterUser = res.data.user.filter((user) => {
          return user.role === "user";
        });

        setUserData(filterUser);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchallInvoice(
          currentPage,
          invoicesPerPage,
          filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
          filterCollection !== "all"
            ? filterCollection === "notCollected"
              ? "not_collected"
              : "collected"
            : undefined,
          filterAssignedUser !== "all" ? filterAssignedUser : undefined,
          selectedProvince !== "all" ? selectedProvince : undefined,
          searchInvoiceNumber || undefined
        );

        console.log(res);

        setTotalPages(res.data.pagination.totalPages);
        setAssignedCustomerCodes(res.data.summary.totalInvoices);
        setUnAssignedCustomerCodes(res.data.summary.unassignedInvoices);
        setTotalAmountInfo(res.data.summary.totalAmount);
        const data = res.data.data;
        setInvoices(data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
        setError("Không thể tải dữ liệu hóa đơn. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [
    currentPage,
    invoicesPerPage,
    filterPrint,
    filterCollection,
    filterAssignedUser,
    selectedProvince,
    searchInvoiceNumber,
  ]);

  const reloadInvoices = async () => {
    const res = await fetchallInvoice(
      currentPage,
      invoicesPerPage,
      filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
      filterCollection !== "all" ? (filterCollection === "notCollected" ? "not_collected" : "collected") : undefined,
      filterAssignedUser !== "all" ? filterAssignedUser : undefined,
      selectedProvince !== "all" ? selectedProvince : undefined
    );

    setInvoices(res.data.data);
    setAssignedCustomerCodes(res.data.summary.totalInvoices);
    setUnAssignedCustomerCodes(res.data.summary.unassignedInvoices);
    setTotalAmountInfo(res.data.summary.totalAmount);
    setTotalPages(res.data.pagination.totalPages);
  };

  // --- Hàm xuất Excel ---
  const handleExport = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcel`;
  };

  const handleExportPrinted = () => {
    if (!selectedDate) {
      alert("Vui lòng chọn ngày trước khi xuất!");
      return;
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcelPrinted?date=${selectedDate}`;
  };

  // --- Hàm đổi trang ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleToggle = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
    try {
      const res = await handleToggle_API(invoiceId, field);
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
                collectionDate:
                  field === "collectionStatus"
                    ? inv.collectionStatus === "collected"
                      ? null
                      : new Date().toISOString()
                    : inv.collectionDate,
              }
            : inv
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  // --- SỬA ĐỔI: Đổi cấu trúc tiêu đề bảng để dễ dàng thêm onClick ---
  const tableHeaders: { key: keyof InvoiceInfo | null; label: string; sortable: boolean }[] = [
    { key: null, label: "✓", sortable: false },
    { key: null, label: "STT", sortable: false },
    { key: "invoiceNumber", label: "Mã Khách Hàng", sortable: true },
    { key: "customerName", label: "Tên Khách Hàng", sortable: true },
    { key: "customerAddress", label: "Địa Chỉ", sortable: true },
    { key: "currentAmount", label: "Kỳ này", sortable: true },
    { key: "previousAmount", label: "Kỳ trước", sortable: true },
    { key: "totalAmount", label: "Tổng tiền nợ", sortable: false },
    { key: "customerPhone", label: "SĐT", sortable: true },
    { key: "note", label: "Ghi chú", sortable: false },
    { key: "assignedTo", label: "Nhân viên phụ trách", sortable: false }, // Giả sử không sort theo object
    { key: null, label: "Đã in bill", sortable: false },
    { key: null, label: "Đã thu", sortable: false },
    { key: "collectionDate", label: "Ngày thu", sortable: true },
    { key: "issueDate", label: "Ngày giao", sortable: true },
    { key: "billing_period", label: "Tháng nợ", sortable: true },
    { key: null, label: "Hành động", sortable: false },
  ];

  return (
    <AdminRoute fallback={<p>Redirecting...</p>}>
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
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={invoices.length === 0}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
                minWidth: { xs: "120px", sm: "160px" },
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
          </Box>
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

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            minWidth: { xs: "120px", sm: "160px" },
            marginBottom: 2,
            marginRight: 2,
          }}
        >
          Thêm mới hoá đơn
        </Button>

        <Button
          variant="contained"
          color="error"
          disabled={selectedInvoices.length === 0}
          onClick={async () => {
            if (selectedInvoices.length === 0) {
              toast.error("Vui lòng chọn ít nhất một hoá đơn để xoá!");
              return;
            }

            const confirmDelete = window.confirm(
              `Bạn có chắc muốn xoá ${selectedInvoices.length} hoá đơn đã chọn không?`
            );
            if (!confirmDelete) return;

            try {
              // Gọi API xoá nhiều
              await Promise.all(selectedInvoices.map((id) => deleteInvoice_API(id)));

              toast.success("Đã xoá thành công các hoá đơn đã chọn!");
              setSelectedInvoices([]); // Xóa xong thì bỏ chọn hết
              await reloadInvoices(); // Cập nhật lại danh sách
            } catch (error) {
              console.error(error);
              toast.error("Lỗi khi xoá hoá đơn!");
            }
          }}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            minWidth: { xs: "120px", sm: "160px" },
            marginBottom: 2,
            marginRight: 2,
          }}
        >
          Xoá các hoá đơn đã chọn
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => setOpenUploadWithProvince(true)}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            minWidth: { xs: "120px", sm: "160px" },
            marginBottom: 2,
            marginRight: 2,
          }}
        >
          Upload Excel + Tỉnh
        </Button>

        <TextField
          label="Tìm theo Mã khách hàng"
          size="small"
          value={searchInvoiceNumber}
          onChange={(e) => {
            setSearchInvoiceNumber(e.target.value);
            setCurrentPage(1); // Reset về trang 1 khi search
          }}
          sx={{
            minWidth: { xs: 150, sm: 200 },
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            marginBottom: 3,
          }}
        />

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

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 140, sm: 160 },
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
            }}
          >
            <InputLabel id="assigned-user-label">Người phụ trách</InputLabel>
            <Select
              labelId="assigned-user-label"
              value={filterAssignedUser}
              label="Người phụ trách"
              onChange={(e) => {
                setFilterAssignedUser(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName || user.email}
                </MenuItem>
              ))}
              <MenuItem value="no_one">Chưa phụ trách</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 140, sm: 160 },
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
            }}
          >
            <InputLabel id="province-label">Tỉnh</InputLabel>
            <Select
              labelId="province-label"
              value={selectedProvince}
              label="Tỉnh"
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {provinces.map((province) => (
                <MenuItem key={province} value={province}>
                  {province}
                </MenuItem>
              ))}
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
          {filterAssignedUser === "all" && (
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
                Tổng số nhân viên
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2563eb" }}>
                {userData.length}
              </Typography>
            </Box>
          )}

          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
              Số mã khách hàng đang phụ trách
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#16a34a" }}>
              {assignedCustomerCodes}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
              Số mã khách hàng chưa được phụ trách
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#16a34a" }}>
              {unassignedCustomerCodes}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
              Tổng giá trị hoá đơn
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#dc2626" }}>
              {totalAmountInfo.toLocaleString("vi-VN")} đ
            </Typography>
          </Box>
        </Box>

        {/* --- Bảng dữ liệu --- */}
        <Box sx={{ overflowX: "auto" }}>
          {loading ? (
            <Typography sx={{ p: 4, textAlign: "center" }}>Đang tải dữ liệu hóa đơn...</Typography>
          ) : invoices.length === 0 ? (
            <Typography sx={{ p: 4, textAlign: "center" }}>Không có hóa đơn nào được tìm thấy.</Typography>
          ) : (
            <>
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
                      {tableHeaders.map((header, index) => (
                        <th
                          key={header.label}
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
                            {index === 0 ? ( // ✅ Nếu là cột đầu tiên thì hiển thị checkbox chọn tất cả
                              <input
                                type="checkbox"
                                checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedInvoices(invoices.map((inv) => inv._id));
                                  } else {
                                    setSelectedInvoices([]);
                                  }
                                }}
                              />
                            ) : (
                              header.label // Còn lại thì hiển thị tên cột
                            )}
                          </Box>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {invoices.map((invoice, index) => (
                      <tr key={invoice._id} style={{ backgroundColor: "#fff" }}>
                        <td style={{ border: "1px solid #ddd", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvoices((prev) => [...prev, invoice._id]);
                              } else {
                                setSelectedInvoices((prev) => prev.filter((id) => id !== invoice._id));
                              }
                            }}
                          />
                        </td>

                        <td
                          style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem", textAlign: "center" }}
                        >
                          {index + 1 + (currentPage - 1) * invoicesPerPage}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.invoiceNumber}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.customerName}
                        </td>

                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.customerAddress}
                        </td>

                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.currentAmount}
                        </td>

                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.previousAmount}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.totalAmount}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.customerPhone}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.note}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.assignedTo?.fullName}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                          <Switch
                            checked={invoice.printStatus === "printed"}
                            onChange={() => handleToggle(invoice._id, "printStatus")}
                            color="primary"
                            sx={{ transform: "scale(0.8)" }}
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
                          {invoice.collectionDate
                            ? new Date(invoice.collectionDate).toLocaleDateString("vi-VN")
                            : "---"}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("vi-VN") : "---"}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>
                          {invoice.billing_period}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "6px", textAlign: "center" }}>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, invoice)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <MenuItem
                  onClick={() => {
                    if (!selectedInvoice) return;

                    // Mở form chỉnh sửa hoá đơn
                    // Giả sử bạn có state để show modal hoặc navigate tới trang chỉnh sửa
                    setEditingInvoice(selectedInvoice); // ví dụ: state để mở modal
                    setEditModalOpen(true); // mở modal chỉnh sửa
                    handleMenuClose();
                  }}
                  sx={{ color: "blue", fontSize: 13 }}
                >
                  Chỉnh sửa hoá đơn
                </MenuItem>

                <MenuItem
                  onClick={async () => {
                    if (!selectedInvoice) return;

                    // ✅ Hỏi xác nhận trước khi xoá
                    const confirmDelete = window.confirm(
                      `Bạn có chắc muốn xoá hoá đơn ${selectedInvoice.invoiceNumber}?`
                    );
                    if (!confirmDelete) return;

                    try {
                      const res = await deleteInvoice_API(selectedInvoice._id);

                      if (res?.status === 200 || res?.status === 204) {
                        toast.success("Xoá hoá đơn thành công!");

                        // 🔁 Gọi lại API fetchallInvoice với đúng bộ lọc hiện tại
                        await reloadInvoices();
                      } else {
                        toast.error("Không thể xoá hoá đơn, vui lòng thử lại.");
                      }
                    } catch (error) {
                      console.error("Lỗi khi xoá hoá đơn:", error);
                      alert("Đã xảy ra lỗi khi xoá hoá đơn.");
                    } finally {
                      handleMenuClose();
                    }
                  }}
                  sx={{ color: "red", fontSize: 13 }}
                >
                  Xoá hoá đơn
                </MenuItem>
              </Menu>

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
      </Box>

      <AddInvoiceDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => {
          // Gọi lại API load danh sách sau khi thêm mới thành công
          (async () => {
            await reloadInvoices();
            toast.success("Thêm hoá đơn thành công!");
          })();
        }}
        assignedUsers={userData}
        billing_period={billing_period}
      />

      <EditInvoiceDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        invoice={editingInvoice}
        onSuccess={async () => {
          await reloadInvoices();
        }}
        assignedUsers={userData}
      />

      <UploadInvoiceWithProvinceDialog
        open={openUploadWithProvince}
        onClose={() => setOpenUploadWithProvince(false)}
        onSuccess={(data) => setInvoices(data)}
      />
    </AdminRoute>
  );
}
