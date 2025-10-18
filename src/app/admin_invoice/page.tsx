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

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");

  const [totalAmountInfo, setTotalAmountInfo] = useState(0);

  const [openAddDialog, setOpenAddDialog] = useState(false);

  // --- THÊM MỚI: State để quản lý việc sắp xếp ---
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InvoiceInfo | null;
    direction: "ascending" | "descending" | null;
  }>({
    key: null,
    direction: null,
  });

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
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchallInvoice();
        const data = res.data;
        setInvoices(data);
      } catch (err) {
        console.error("Lỗi khi tải hóa đơn:", err);
        setError("Không thể tải dữ liệu hóa đơn. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

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
    fetchInvoices();
  }, []);

  // Lấy kỳ hiện tại
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();

  if (month === 0) {
    month = 12;
    year -= 1;
  }

  const billing_period = `${month.toString().padStart(2, "0")}/${year}`;

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

    const matchAssignedUser =
      filterAssignedUser === "all" ? true : inv.assignedTo && inv.assignedTo._id === filterAssignedUser;

    const matchDate =
      selectedDate === "" || filterCollection !== "collected"
        ? true
        : inv.collectionDate && new Date(inv.collectionDate).toLocaleDateString("en-CA") === selectedDate;

    const matchSearch =
      searchInvoiceNumber.trim() === ""
        ? true
        : inv.invoiceNumber.toLowerCase().includes(searchInvoiceNumber.trim().toLowerCase());

    return matchPrint && matchCollection && matchAssignedUser && matchDate && matchSearch;
  });

  // --- THÊM MỚI: Logic sắp xếp dữ liệu ---
  // Sử dụng useMemo để chỉ sắp xếp lại khi dữ liệu hoặc cấu hình sort thay đổi
  const sortedInvoices = useMemo(() => {
    const sortableInvoices = [...filteredInvoices];

    // 🔹 Bước 1: Ưu tiên hiển thị các hóa đơn có tổng tiền > 0 lên trên
    sortableInvoices.sort((a, b) => {
      const totalA =
        (parseFloat(a.currentAmount?.toString().replace(/[^\d.-]/g, "")) || 0) +
        (parseFloat(a.previousAmount?.toString().replace(/[^\d.-]/g, "")) || 0);

      const totalB =
        (parseFloat(b.currentAmount?.toString().replace(/[^\d.-]/g, "")) || 0) +
        (parseFloat(b.previousAmount?.toString().replace(/[^\d.-]/g, "")) || 0);

      // Nếu A có nợ mà B không có nợ → A lên trước
      if (totalA > 0 && totalB <= 0) return -1;
      if (totalA <= 0 && totalB > 0) return 1;
      return 0; // Giữ nguyên thứ tự cho các nhóm tương tự
    });

    // 🔹 Bước 2: Áp dụng sắp xếp theo cột người dùng chọn (nếu có)
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableInvoices.sort((a, b) => {
        const aValue = a[sortConfig.key!] as string | number | null | undefined;
        const bValue = b[sortConfig.key!] as string | number | null | undefined;

        const isEmptyA = aValue === null || aValue === undefined || aValue === "" || aValue === "Không nợ cước";
        const isEmptyB = bValue === null || bValue === undefined || bValue === "" || bValue === "Không nợ cước";

        if (isEmptyA && !isEmptyB) return 1;
        if (!isEmptyA && isEmptyB) return -1;

        let comparison = 0;
        if (sortConfig.key === "currentAmount") {
          const numA = parseFloat(String(aValue).replace(/[^\d.-]/g, ""));
          const numB = parseFloat(String(bValue).replace(/[^\d.-]/g, ""));
          comparison = numA > numB ? 1 : numA < numB ? -1 : 0;
        } else {
          const strA = String(aValue ?? "").toLowerCase();
          const strB = String(bValue ?? "").toLowerCase();
          if (strA > strB) comparison = 1;
          else if (strA < strB) comparison = -1;
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison;
      });
    }

    return sortableInvoices;
  }, [filteredInvoices, sortConfig]);

  // --- THÊM MỚI: Hàm xử lý khi click vào header cột ---
  const handleSort = (key: keyof InvoiceInfo) => {
    // console.log(key);

    let direction: "ascending" | "descending" | null = "descending"; // Mặc định lần đầu là cao -> thấp

    if (sortConfig.key === key) {
      if (sortConfig.direction === "descending") {
        direction = "ascending"; // Chuyển sang thấp -> cao
      } else if (sortConfig.direction === "ascending") {
        direction = null; // Trở về bình thường
      }
    }

    setSortConfig({ key: direction === null ? null : key, direction });
    setCurrentPage(1); // Quay về trang 1 khi sắp xếp
  };

  // --- Tính toán dữ liệu trang hiện tại ---
  // --- SỬA ĐỔI: Sử dụng mảng đã được sắp xếp `sortedInvoices` ---
  // --- Phân trang sau khi đã sắp xếp toàn bộ ---
  const currentInvoices = useMemo(() => {
    const indexOfLastInvoice = currentPage * invoicesPerPage;
    const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
    return sortedInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  }, [sortedInvoices, currentPage, invoicesPerPage]);

  // --- Tổng số trang sau khi lọc ---
  // --- SỬA ĐỔI: Dùng sortedInvoices (hoặc filteredInvoices cũng được vì length như nhau) ---
  const totalPages = Math.ceil(sortedInvoices.length / invoicesPerPage);

  // --- Tính toán tổng giá trị hoá đơn (bao gồm cả kỳ trước + kỳ này) ---
  // Trong useEffect tính tổng
  useEffect(() => {
    const total = filteredInvoices.reduce((sum, inv) => {
      const prev = parseFloat(inv.previousAmount?.toString().replace(/[^\d.-]/g, "") ?? "0");
      const curr = parseFloat(inv.currentAmount?.toString().replace(/[^\d.-]/g, "") ?? "0");

      return sum + prev + curr;
    }, 0);

    setTotalAmountInfo(total);
  }, [filteredInvoices]);

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

  if (loading) return <p style={{ padding: "2rem" }}>Đang tải dữ liệu hóa đơn...</p>;
  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  // --- THÊM MỚI: Hàm render icon sắp xếp ---
  const getSortIcon = (key: keyof InvoiceInfo) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return null;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUpwardIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
    );
  };

  // --- SỬA ĐỔI: Đổi cấu trúc tiêu đề bảng để dễ dàng thêm onClick ---
  const tableHeaders: { key: keyof InvoiceInfo | null; label: string; sortable: boolean }[] = [
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
              {filteredInvoices.length}
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
        {invoices.length === 0 ? (
          <Typography>Không có hóa đơn nào được tìm thấy.</Typography>
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
                    {/* --- SỬA ĐỔI: Dùng map từ mảng tableHeaders --- */}
                    {tableHeaders.map((header) => (
                      <th
                        key={header.label}
                        style={{
                          border: "1px solid #e0e0e0",
                          padding: "8px 6px",
                          textAlign: "left",
                          backgroundColor: "#f5f5f5",
                          fontSize: "0.75rem",
                          cursor: header.sortable ? "pointer" : "default",
                          userSelect: "none", // Tránh bôi đen text khi click
                        }}
                        onClick={header.sortable ? () => handleSort(header.key!) : undefined}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {header.label}
                          {header.sortable && getSortIcon(header.key!)}
                        </Box>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.map((invoice, index) => (
                    <tr key={invoice._id} style={{ backgroundColor: "#fff" }}>
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
                      <td style={{ border: "1px solid #ddd", padding: "6px", fontSize: "0.75rem" }}>{invoice.note}</td>
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
                        {invoice.collectionDate ? new Date(invoice.collectionDate).toLocaleDateString("vi-VN") : "---"}
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

                    if (res!.status === 200 || res!.status === 204) {
                      toast.success("Xoá hoá đơn thành công!");
                      const result = await fetchallInvoice(); // 🔁 Load lại danh sách
                      setInvoices(result.data);
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

      <AddInvoiceDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => {
          // Gọi lại API load danh sách sau khi thêm mới thành công
          (async () => {
            const res = await fetchallInvoice();
            setInvoices(res.data);
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
          const res = await fetchallInvoice();
          setInvoices(res.data);
        }}
        assignedUsers={userData}
      />
    </AdminRoute>
  );
}
