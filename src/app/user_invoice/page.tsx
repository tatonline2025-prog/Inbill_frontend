// app/admin/invoices/page.tsx (User Page - Sau khi refactor)

"use client";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "@/hooks/useAuth";

import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import InvoiceSummary from "@/components/invoices/InvoiceSummary";
import UploadInvoiceDialog from "@/components/UploadInvoiceByUserDialog";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import { useUserInvoiceManagement } from "@/hooks/useUserInvoiceManagement";
import ProtectedRoute from "@/components/ProtectedRoute";
import CollectionSummary from "@/components/invoices/CollectionSummary";

export default function InvoicesPage() {
  const { isAuthenticated, user } = useAuth(); // Hook 1

  // 💡 Định nghĩa đối tượng IUser mặc định (Placeholder)

  // 💡 GỌI HOOK TRƯỚC EARLY RETURN
  // Truyền user (nếu có) hoặc defaultUser (nếu user là null)
  const currentUser = user;

  const {
    collectSummary,
    loading,
    error,
    currentPage,
    invoicesPerPage,
    totalPages,
    assignedCustomerCodes,
    unassignedCustomerCodes,
    totalAmountInfo,
    filterPrint,
    filterCollection,
    isPaidFilter,
    searchType,
    searchValue,
    sortField,
    sortDirection,
    openAddDialog,
    openUploadDialog,
    openExportCollected,
    editingInvoice,
    editModalOpen,
    selectedInvoices,
    anchorEl,

    sortedInvoices,
    searchLabel,

    setFilterPrint,
    setFilterCollection,
    setOpenAddDialog,
    setOpenUploadDialog,
    setOpenExportCollected,
    setEditModalOpen,

    handlePageChange,
    handleRowsPerPageChange,
    handleFilterChange,
    handleIsPaidFilterChange,
    onSearchChange,
    handleSearchTypeChange,
    handleSort,
    handleSelectAll,
    handleSelectOne,
    handleDeleteSelected,
    handleToggle,
    handleMenuOpen,
    handleMenuClose,
    handleOpenEdit,
    handleDeleteInvoice,
    handleExport,
    handleOpenExportCollected,
    handleExportCollectedConfirm,
    reloadInvoices,
    handleAddSuccess,
    handleEditSuccess,

    collectedFromDate,
    setCollectedFromDate,
    collectedToDate,
    setCollectedToDate,
    collectedStatus,
    setCollectedStatus,
    closingStatus,
    setClosingStatus,

    openExportAllModal,
    setOpenExportAllModal,
    allCollectionStatus,
    setAllCollectionStatus,
    allPaymentStatus,
  } = useUserInvoiceManagement({ user: currentUser });

  if (!isAuthenticated || !user) {
    return <p style={{ padding: "2rem" }}>Vui lòng đăng nhập...</p>;
  }

  // 💡 Logic kiểm tra lỗi (sử dụng error từ hook)
  if (error) {
    return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;
  }

  const fetchAllInvoicesForCopy = async () => {
    return sortedInvoices;
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "internal"]} redirectTo="/">
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
              onClick={() => setOpenExportAllModal(true)}
              disabled={sortedInvoices.length === 0}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Xuất ra Excel toàn bộ
            </Button>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleOpenExportCollected}
              disabled={sortedInvoices.length === 0 || user.role !== "admin"}
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
              disabled={user.role !== "admin"}
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

        {/* --- Action Buttons + Search --- */}
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

          {/* KHỐI TÌM KIẾM */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 150 } }}>
              <InputLabel id="search-type-label">Tìm theo</InputLabel>
              <Select labelId="search-type-label" value={searchType} label="Tìm theo" onChange={handleSearchTypeChange}>
                <MenuItem value="customerCode">Mã khách hàng</MenuItem>
                <MenuItem value="stationCode">Mã trạm</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={searchLabel}
              size="small"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              sx={{ minWidth: { xs: 150, sm: 200 } }}
            />
          </Box>
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
              <MenuItem value="not_collected">Chưa thu</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={isPaidFilter}
                onChange={(e) => handleIsPaidFilterChange(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label="Đã đóng cước"
            sx={{ ml: 0.5 }}
          />
        </Box>

        {/* --- Summary --- */}
        <InvoiceSummary
          assignedCustomerCodes={assignedCustomerCodes}
          unassignedCustomerCodes={unassignedCustomerCodes}
          totalAmountInfo={totalAmountInfo}
        />

        <CollectionSummary
          collected={collectSummary?.collected}
          notCollected={collectSummary?.notCollected}
          total={collectSummary?.total}
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
          showIsPaidColumn
          onFetchAllData={fetchAllInvoicesForCopy}
        />
        {!loading && sortedInvoices.length > 0 && (
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", alignItems: "center" }}>
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
        assignedUsers={[]}
      />
      <AddInvoiceDialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} onSuccess={handleAddSuccess} />
      <UploadInvoiceDialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        onSuccess={reloadInvoices}
        assignedUserId={user._id || ""}
        assignedUserName={user.fullName || "Người phụ trách"}
      />

      {/* --- Export Collected Dialog --- */}
      <Dialog open={openExportCollected} onClose={() => setOpenExportCollected(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            paddingBottom: 0,
            borderBottom: "1px solid #eee",
          }}
        >
          Xuất Excel Hóa Đơn Chọn Lọc
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "16px !important" }}>
          {/* 1. Chọn kiểu thời gian (Thêm mới) */}
          {/* <FormControl component="fieldset" sx={{ mt: 1, mb: 1.5 }}>
            <RadioGroup
              row
              name="dateFilterType"
              value={dateFilterType}
              onChange={(e) => {
                setDateFilterType(e.target.value);

                setCollectedFromDate(collectedFromDate);
                setCollectedToDate(collectedFromDate);
              }}
            >
              <FormControlLabel value="single" control={<Radio size="small" />} label="Một ngày cụ thể" />
              <FormControlLabel value="range" control={<Radio size="small" />} label="Khoảng thời gian" />
            </RadioGroup>
          </FormControl> */}

          {/* {dateFilterType === "single" ? (
            <TextField
              label="Chọn ngày"
              type="date"
              fullWidth
              value={collectedFromDate}
              onChange={(e) => {
                setCollectedFromDate(e.target.value);
                setCollectedToDate(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              helperText="Chọn ngày cần xuất báo cáo"
            />
          ) : ( */}

          <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
            <TextField
              label="Từ ngày"
              type="date"
              fullWidth
              margin="dense"
              value={collectedFromDate}
              onChange={(e) => setCollectedFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Đến ngày"
              type="date"
              fullWidth
              margin="dense"
              value={collectedToDate}
              onChange={(e) => setCollectedToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>
          {/* )} */}

          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            {/* Trạng thái thu */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Trạng thái thu</InputLabel>
              <Select
                value={collectedStatus}
                label="Trạng thái thu"
                onChange={(e) => setCollectedStatus(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="paid">Đã thu</MenuItem>
                <MenuItem value="unpaid">Chưa thu</MenuItem>
              </Select>
            </FormControl>

            {/* Trạng thái đóng cước */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Đóng cước</InputLabel>
              <Select value={closingStatus} label="Đóng cước" onChange={(e) => setClosingStatus(e.target.value)}>
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="true">Đã đóng</MenuItem>
                <MenuItem value="false">Chưa đóng</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenExportCollected(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleExportCollectedConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openExportAllModal}
        onClose={() => setOpenExportAllModal(false)}
        maxWidth="xs" // Thu nhỏ lại một chút cho cân đối
        fullWidth
      >
        <DialogTitle
          sx={{
            paddingBottom: 1,
            borderBottom: "1px solid #eee",
            fontWeight: "bold",
          }}
        >
          Xuất Excel Toàn Bộ Hóa Đơn
        </DialogTitle>

        <DialogContent sx={{ paddingTop: "20px !important" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Chọn các trạng thái bạn muốn lọc trước khi xuất file toàn bộ dữ liệu:
          </Typography>

          <Stack spacing={2.5}>
            {/* Lọc Trạng thái thu */}
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái thu</InputLabel>
              <Select
                value={allCollectionStatus}
                label="Trạng thái thu"
                onChange={(e) => setAllCollectionStatus(e.target.value)}
              >
                <MenuItem value="all">Tất cả trạng thái thu</MenuItem>
                <MenuItem value="paid">Đã thu</MenuItem>
                <MenuItem value="unpaid">Chưa thu</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid #eee" }}>
          <Button onClick={() => setOpenExportAllModal(false)} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              // Gọi hàm handleExport và truyền các trạng thái đã lọc
              await handleExport(allCollectionStatus, allPaymentStatus);
              setOpenExportAllModal(false);
            }}
          >
            Xác nhận Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
}




