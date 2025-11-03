"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { deleteInvoice_API, fetchallInvoice, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Select,
  Switch,
  TextField,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useAuth } from "@/hooks/useAuth";

import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import AddIcon from "@mui/icons-material/Add";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import toast from "react-hot-toast";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import InvoiceSummary from "@/components/invoices/InvoiceSummary";
import UploadInvoiceDialog from "@/components/UploadInvoiceByUserDialog";
import InvoiceTable from "@/components/invoices/InvoiceTable";

export default function InvoicesPage() {
  // --- Auth ---
  const { isAuthenticated, user } = useAuth();

  // --- Data & Loading States ---
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all"); // (Note: Cân nhắc nếu user page cần filter này)
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");

  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // --- Summary States ---
  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(0);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(0);
  const [totalAmountInfo, setTotalAmountInfo] = useState(0);

  // --- Table Selection State ---
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // --- Dialog States ---
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openExportCollected, setOpenExportCollected] = useState(false);
  const [selectedCollectedDate, setSelectedCollectedDate] = useState("");

  // --- Edit Dialog State ---
  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);

  // --- Action Menu State ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | "none">("none");

  // --- 1. Data Fetching ---

  const reloadInvoices = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const sortFieldToSend = sortDirection !== "none" ? sortField : undefined;
    const sortDirectionToSend = sortDirection !== "none" ? sortDirection : undefined;

    try {
      const res = await fetchallInvoice(
        currentPage,
        invoicesPerPage,
        filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
        filterCollection !== "all" ? (filterCollection === "notCollected" ? "not_collected" : "collected") : undefined,
        user?._id,
        selectedProvince !== "all" ? selectedProvince : undefined,
        searchInvoiceNumber || undefined, // <-- SỬA LỖI: Thêm filter
        user.province, // <-- SỬA LỖI: Thêm filter
        sortFieldToSend,
        sortDirectionToSend
      );

      setTotalPages(res.data.pagination.totalPages);
      setAssignedCustomerCodes(res.data.summary.totalInvoices);
      setUnAssignedCustomerCodes(res.data.summary.unassignedInvoices);
      setTotalAmountInfo(res.data.summary.totalAmount);
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Lỗi khi tải hóa đơn:", err);
      setError("Không thể tải dữ liệu hóa đơn. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [
    user,
    currentPage,
    invoicesPerPage,
    filterPrint,
    filterCollection,
    selectedProvince,
    searchInvoiceNumber,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    reloadInvoices();
  }, [reloadInvoices]); // Chỉ cần gọi reloadInvoices ở đây

  // --- 2. Event Handlers (UI) ---

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const handleRowsPerPageChange = (e: SelectChangeEvent<number>) => {
    setInvoicesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: SelectChangeEvent) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInvoiceNumber(e.target.value);
    setCurrentPage(1);
  };

  // --- 3. Table Handlers ---

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(invoices.map((inv) => inv._id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedInvoices((prev) => [...prev, id]);
    } else {
      setSelectedInvoices((prev) => prev.filter((invId) => invId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Vui lòng chọn ít nhất một hoá đơn để xoá!");
      return;
    }

    const confirmDelete = window.confirm(`Bạn có chắc muốn xoá ${selectedInvoices.length} hoá đơn đã chọn không?`);
    if (!confirmDelete) return;

    try {
      await Promise.all(selectedInvoices.map((id) => deleteInvoice_API(id)));
      toast.success("Đã xoá thành công các hoá đơn đã chọn!");
      setSelectedInvoices([]); // Xóa xong thì bỏ chọn hết
      await reloadInvoices(); // Cập nhật lại danh sách
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xoá hoá đơn!");
    }
  };

  const handleToggle = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
    try {
      await handleToggle_API(invoiceId, field);
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

  // --- 4. Menu Handlers ---

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: InvoiceInfo) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleOpenEdit = () => {
    if (!selectedInvoice) return;
    setEditingInvoice(selectedInvoice);
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    const confirmDelete = window.confirm(`Bạn có chắc muốn xoá hoá đơn ${selectedInvoice.invoiceNumber}?`);
    if (!confirmDelete) return;

    try {
      const res = await deleteInvoice_API(selectedInvoice._id);
      if (res!.status === 200 || res!.status === 204) {
        toast.success("Xoá hoá đơn thành công!");
        reloadInvoices();
      } else {
        toast.error("Không thể xoá hoá đơn, vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi xoá hoá đơn:", error);
      alert("Đã xảy ra lỗi khi xoá hoá đơn.");
    } finally {
      handleMenuClose();
    }
  };

  // --- 5. Export Handlers ---

  const handleExport = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcel`;
  };

  const handleOpenExportCollected = () => {
    setOpenExportCollected(true);
  };

  const handleExportCollectedConfirm = async () => {
    if (!user) {
      toast.error("Không tìm thấy thông tin người dùng.");
      return;
    }
    if (!selectedCollectedDate) {
      alert("Vui lòng chọn ngày thu!");
      return;
    }

    const params = new URLSearchParams({
      date: selectedCollectedDate,
      assignedUserId: user._id, // Tự động lấy user ID
    });

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcelCollected?${params.toString()}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) {
        const errorData = await response.json();
        alert(errorData.message || "Có lỗi xảy ra khi xuất file.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : "danh-sach-da-thu.xlsx";

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      setOpenExportCollected(false);
      setSelectedCollectedDate("");
    } catch (error) {
      console.error("Lỗi khi xuất file:", error);
      alert("Không thể kết nối tới máy chủ để xuất file.");
    }
  };

  // --- 6. Dialog Close Handlers ---

  const handleAddSuccess = () => {
    setOpenAddDialog(false);
    reloadInvoices();
    toast.success("Thêm hoá đơn thành công!");
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    reloadInvoices();
  };

  const handleSort = (field: string) => {
    const isNewField = sortField !== field;

    setSortField(field);
    setSortDirection((prev) => {
      if (isNewField) return "desc";
      if (prev === "desc") return "asc";
      if (prev === "asc") return "none";
      return "desc";
    });

    setCurrentPage(1);
  };

  const sortedInvoices = useMemo(() => {
    if (sortField && sortDirection !== "none") {
      return [...invoices].sort((a, b) => {
        const aVal = a[sortField as keyof InvoiceInfo];
        const bVal = b[sortField as keyof InvoiceInfo];
        if (!aVal || !bVal) return 0;
        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
      });
    }
    return invoices;
  }, [invoices, sortField, sortDirection]);

  // --- 7. Auth & Loading Checks ---

  if (!isAuthenticated) {
    return <p style={{ padding: "2rem" }}>Vui lòng đăng nhập...</p>;
  }
  if (error) {
    return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;
  }

  // --- 8. Render ---
  return (
    <>
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Danh Sách Hóa Đơn
        </Typography>

        {/* --- Toolbar --- */}
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
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Xuất ra Excel toàn bộ
            </Button>

            {/* <TextField /> (ĐÃ XÓA) */}

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleOpenExportCollected}
              disabled={invoices.length === 0}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                backgroundColor: "#16a34a",
                "&:hover": { backgroundColor: "#15803d" },
              }}
            >
              Xuất ra Excel đã thu
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={() => setOpenUploadDialog(true)}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Upload Excel
            </Button>
          </Box>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="invoices-per-page-label">Hiển thị</InputLabel>
            <Select
              labelId="invoices-per-page-label"
              value={invoicesPerPage}
              label="Hiển thị"
              onChange={handleRowsPerPageChange}
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

        {/* --- Action Buttons --- */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Thêm mới hoá đơn
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={selectedInvoices.length === 0}
            onClick={handleDeleteSelected}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Xoá ({selectedInvoices.length}) HĐ đã chọn
          </Button>

          <TextField
            label="Tìm theo Mã khách hàng"
            size="small"
            value={searchInvoiceNumber}
            onChange={handleSearchChange}
            sx={{ minWidth: 200 }}
          />
        </Box>

        {/* --- Filter Controls --- */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="filter-print-label">Trạng thái in bill</InputLabel>
            <Select
              labelId="filter-print-label"
              value={filterPrint}
              label="Trạng thái in bill"
              onChange={handleFilterChange(setFilterPrint)}
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
              onChange={handleFilterChange(setFilterCollection)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="collected">Đã thu</MenuItem>
              <MenuItem value="notCollected">Chưa thu</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* --- Summary --- */}
        <InvoiceSummary
          assignedCustomerCodes={assignedCustomerCodes}
          unassignedCustomerCodes={unassignedCustomerCodes}
          totalAmountInfo={totalAmountInfo}
        />

        {/* --- Data Table --- */}
        <InvoiceTable
          loading={loading}
          invoices={sortedInvoices}
          selectedInvoices={selectedInvoices}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          currentPage={currentPage}
          invoicesPerPage={invoicesPerPage}
          onToggleStatus={handleToggle}
          onMenuOpen={handleMenuOpen}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        {!loading && invoices.length > 0 && (
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
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>

      {/* --- Action Menu --- */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleOpenEdit} sx={{ color: "blue", fontSize: 13 }}>
          Chỉnh sửa hoá đơn
        </MenuItem>
        <MenuItem onClick={handleDeleteInvoice} sx={{ color: "red", fontSize: 13 }}>
          Xoá hoá đơn
        </MenuItem>
      </Menu>

      {/* --- Dialogs --- */}
      <EditInvoiceDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        invoice={editingInvoice}
        onSuccess={handleEditSuccess}
        assignedUsers={[]} // SỬA LỖI: User page không cần gán user, truyền mảng rỗng
      />

      <AddInvoiceDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={handleAddSuccess}
        // assignedUsers={[]} // User tự thêm HĐ cho chính mình (logic này nằm trong AddInvoiceDialog)
      />

      <UploadInvoiceDialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        province={user?.province || "TP Cần Thơ"}
        assignedUserId={user?._id || ""}
        assignedUserName={user?.fullName || "Người phụ trách"}
      />

      <Dialog open={openExportCollected} onClose={() => setOpenExportCollected(false)}>
        <DialogTitle>Xuất Excel Hóa Đơn Đã Thu của {user?.fullName}</DialogTitle>
        <DialogContent sx={{ minWidth: 400, paddingTop: "16px !important" }}>
          <TextField
            label="Chọn ngày thu"
            type="date"
            fullWidth
            margin="dense"
            value={selectedCollectedDate}
            onChange={(e) => setSelectedCollectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportCollected(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleExportCollectedConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
