"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

import ProtectedRoute from "@/components/ProtectedRoute";
import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import UploadInvoiceDialog from "@/components/UploadInvoiceByUserDialog";
import InvoiceActionMenu from "@/components/invoices/InvoiceActionMenu";
import InvoiceSummary from "@/components/invoices/InvoiceSummary";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceToolbar from "@/components/invoices/InvoiceToolbar";
import { useAuth } from "@/hooks/useAuth";
import { useUserInvoiceManagement } from "@/hooks/useUserInvoiceManagement";

const USER_COLLECTION_FILTER_OPTIONS = [
  { value: "all", label: "Danh sách đầy đủ" },
  { value: "collected", label: "Tất cả đã thu" },
  { value: "not_collected", label: "Chưa thu" },
  { value: "is_paid", label: "Đã đóng cước" },
] as const;

export default function UserInvoicePage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();

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
    filterCollectionDate,
    isPaidFilter,
    searchType,
    searchValue,
    sortField,
    sortDirection,
    openAddDialog,
    openUploadDialog,
    editingInvoice,
    editModalOpen,
    selectedInvoices,
    anchorEl,
    selectedInvoice,
    sortedInvoices,
    setOpenAddDialog,
    setOpenUploadDialog,
    setEditModalOpen,
    fetchAllInvoicesForCopy,
    reloadInvoices,
    handlePageChange,
    handleInvoicesPerPageValueChange,
    handlePrintFilterValueChange,
    handleCollectionFilterValueChange,
    handleCollectionDateFilterChange,
    onSearchChange,
    handleSearchTypeValueChange,
    handleSort,
    handleSelectAll,
    handleSelectOne,
    handleDeleteSelected,
    handleToggle,
    handleMenuOpen,
    handleMenuClose,
    handleEditInvoice,
    handleExport,
    handleExportCollectedOnly,
    handleAddSuccess,
    handleEditSuccess,
    openExportAllModal,
    setOpenExportAllModal,
    allCollectionStatus,
    setAllCollectionStatus,
    allPaymentStatus,
    setAllPaymentStatus,
  } = useUserInvoiceManagement({ user });

  if (authLoading) {
    return <p style={{ padding: "2rem" }}>Đang tải thông tin đăng nhập...</p>;
  }

  if (!isAuthenticated || !user) {
    return <p style={{ padding: "2rem" }}>Vui lòng đăng nhập...</p>;
  }

  if (error) {
    return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;
  }

  const canExportCollected = (collectSummary?.collected?.count ?? 0) > 0;
  const assignedUsers = [user];

  return (
    <ProtectedRoute allowedRoles={["admin", "internal"]} redirectTo="/">
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Danh Sách Hóa Đơn
        </Typography>

        <InvoiceToolbar
          invoicesCount={sortedInvoices.length}
          onExport={() => setOpenExportAllModal(true)}
          exportButtonLabel="Xuất ra Excel toàn bộ"
          invoicesPerPage={invoicesPerPage}
          onInvoicesPerPageChange={handleInvoicesPerPageValueChange}
          onOpenAddDialog={() => setOpenAddDialog(true)}
          addButtonLabel="Thêm mới hóa đơn"
          selectedInvoicesCount={selectedInvoices.length}
          onDeleteSelected={handleDeleteSelected}
          deleteButtonLabel="Xóa HĐ"
          onOpenUploadWithProvince={() => setOpenUploadDialog(true)}
          uploadButtonLabel="Upload Excel"
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeValueChange}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          filterPrint={filterPrint}
          onFilterPrintChange={handlePrintFilterValueChange}
          filterCollection={isPaidFilter ? "is_paid" : filterCollection}
          onFilterCollectionChange={handleCollectionFilterValueChange}
          collectionFilterLabel="Trạng thái hóa đơn"
          collectionFilterOptions={[...USER_COLLECTION_FILTER_OPTIONS]}
          filterCollectionDate={filterCollectionDate}
          onFilterCollectionDateChange={handleCollectionDateFilterChange}
          extraActions={
            <Button
              variant="contained"
              size="small"
              startIcon={<TaskAltIcon />}
              onClick={handleExportCollectedOnly}
              disabled={!canExportCollected}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                backgroundColor: "#2563eb",
                color: "#fff",
                "&:hover": { backgroundColor: "#1d4ed8" },
              }}
            >
              Xuất ra Excel đã thu
            </Button>
          }
        />

        <InvoiceSummary
          assignedCustomerCodes={assignedCustomerCodes}
          unassignedCustomerCodes={unassignedCustomerCodes}
          totalAmountInfo={totalAmountInfo}
          collected={collectSummary?.collected}
          notCollected={collectSummary?.notCollected}
          isPaid={collectSummary?.isPaid}
        />

        <Box sx={{ overflowX: "auto" }}>
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
      </Box>

      <InvoiceActionMenu
        anchorEl={anchorEl}
        selectedInvoice={selectedInvoice}
        onClose={handleMenuClose}
        onEdit={handleEditInvoice}
        onDeleteSuccess={reloadInvoices}
      />

      <EditInvoiceDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        invoice={editingInvoice}
        onSuccess={handleEditSuccess}
        assignedUsers={assignedUsers}
      />

      <AddInvoiceDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={handleAddSuccess}
        assignedUsers={assignedUsers}
        currentUser={user}
      />

      <UploadInvoiceDialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        onSuccess={reloadInvoices}
        assignedUserId={user._id || ""}
        assignedUserName={user.fullName || "Người phụ trách"}
      />

      <Dialog open={openExportAllModal} onClose={() => setOpenExportAllModal(false)} maxWidth="xs" fullWidth>
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
            Chọn thêm trạng thái nếu bạn muốn lọc trước khi xuất file.
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái thu</InputLabel>
              <Select
                value={allCollectionStatus}
                label="Trạng thái thu"
                onChange={(event) => setAllCollectionStatus(event.target.value)}
              >
                <MenuItem value="all">Tất cả trạng thái thu</MenuItem>
                <MenuItem value="paid">Đã thu</MenuItem>
                <MenuItem value="unpaid">Chưa thu</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Đóng cước</InputLabel>
              <Select
                value={allPaymentStatus}
                label="Đóng cước"
                onChange={(event) => setAllPaymentStatus(event.target.value)}
              >
                <MenuItem value="all">Tất cả trạng thái đóng cước</MenuItem>
                <MenuItem value="true">Đã đóng</MenuItem>
                <MenuItem value="false">Chưa đóng</MenuItem>
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
              await handleExport(allCollectionStatus, allPaymentStatus);
              setOpenExportAllModal(false);
            }}
          >
            Xác nhận xuất Excel
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
}
