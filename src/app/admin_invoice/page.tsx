// app/admin/invoices/page.tsx

"use client";

import { Box, Button, Pagination } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import UploadInvoiceWithProvinceDialog from "@/components/UploadInvoiceWithProvinceDialog";
import DeleteAllInvoicesDialog from "@/components/invoices/DeleteAllInvoicesDialog";

// Import Custom Hook
import { useInvoiceManagement } from "@/hooks/useInvoiceManagement";

// Import các component con
import InvoiceToolbar from "@/components/invoices/InvoiceToolbar";
import InvoiceSummary from "@/components/invoices/InvoiceSummary";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceActionMenu from "@/components/invoices/InvoiceActionMenu";
import ExportModals from "@/components/invoices/ExportModals"; // Component mới
import toast from "react-hot-toast";
import UploadPaidInvoicesDialog from "@/components/UploadPaidInvoicesDialog";
import { fetchInvoicesForCopyAPI, syncDuplicateInvoices_API, cleanupRedundantDuplicates_API } from "@/services/invoice.api";

export default function InvoicesPage() {
  const {
    invoices,
    duplicateInvoiceNumbers,
    collectSummary,
    userData,
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
    filterAssignedUser,
    isPaidFilter,
    selectedProvince,
    searchType,
    searchValue,
    sortField,
    sortDirection,
    openAddDialog,
    openDeleteAllModal,
    openUploadWithProvince,
    openUploadpaidInvoice,
    editingInvoice,
    editModalOpen,
    selectedInvoices,
    anchorEl,
    selectedInvoice,
    openExportByUser,
    selectedExportUser,
    openExportCollected,
    collectedFromDate,
    collectedToDate,
    selectedCollectedUsers,
    collectedStatus,
    closingStatus,

    billingPeriods,
    provinces,

    setFilterPrint,
    setFilterCollection,
    setFilterAssignedUser,
    setIsPaidFilter,
    setSelectedProvince,
    setOpenAddDialog,
    setEditModalOpen,
    setOpenDeleteAllModal,
    setOpenUploadWithProvince,
    setOpenUploadPaidInvoice,
    setSelectedExportUser,
    setOpenExportByUser,
    setOpenExportCollected,
    setCollectedFromDate,
    setCollectedToDate,
    setSelectedCollectedUsers,
    setCollectedStatus,
    setClosingStatus,

    reloadInvoices,
    handleInvoicesPerPageChange,
    handlePageChange,
    createFilterChangeHandler,
    handleSearchTypeChange,
    handleSearchChange,
    handleBulkSearch,
    handleSort,
    handleMenuOpen,
    handleMenuClose,
    handleEditInvoice,
    handleEditSuccess,
    handleDeleteSelected,
    handleBulkUpdate,
    handleSelectAll,
    handleSelectOne,
    handleToggle,
    handleToggleIsPaid,
    handleExportConfirm,
    handleExportPrinted,
    handleExportByUserConfirm,
    handleExportCollectedConfirm,

    openExportModal,
    setOpenExportModal,
    selectedUsers,
    setSelectedUsers,
    collectionStatus,
    setCollectionStatus,
    paymentStatus,
    setPaymentStatus,
  } = useInvoiceManagement();

  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  const fetchAllInvoicesForCopy = async () => {
    // Gọi API lấy TẤT CẢ hóa đơn theo filter hiện tại (bỏ qua page/limit)
    const response = await fetchInvoicesForCopyAPI(
      filterPrint,
      filterCollection,
      filterAssignedUser,
      isPaidFilter,
      selectedProvince
    );
    return response;
  };

  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
      <Box sx={{ p: 4 }}>
        {/* === TOOLBAR === */}
        <InvoiceToolbar
          invoicesCount={invoices.length}
          onExport={() => setOpenExportModal(true)}
          onExportPrinted={handleExportPrinted}
          invoicesPerPage={invoicesPerPage}
          onInvoicesPerPageChange={handleInvoicesPerPageChange}
          onOpenAddDialog={() => setOpenAddDialog(true)}
          selectedInvoicesCount={selectedInvoices.length}
          onDeleteSelected={handleDeleteSelected}
          onOpenDeleteAllModal={() => setOpenDeleteAllModal(true)}
          onOpenUploadWithProvince={() => setOpenUploadWithProvince(true)}
          onOpenUploadPaidInvoices={() => setOpenUploadPaidInvoice(true)}
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          searchValue={searchValue} // Dùng searchValue
          onSearchChange={handleSearchChange}
          onOpenExportByUser={() => setOpenExportByUser(true)}
          onBulkSearch={handleBulkSearch}
          filterPrint={filterPrint}
          onFilterPrintChange={createFilterChangeHandler(setFilterPrint)}
          filterCollection={isPaidFilter ? "is_paid" : filterCollection}
          onFilterCollectionChange={(value) => {
            // Khi chọn "Đã đóng cước" → bật isPaidFilter và reset filterCollection về "all"
            if (value === "is_paid") {
              setIsPaidFilter(true);
              setFilterCollection("all");
            } else {
              setIsPaidFilter(false);
              setFilterCollection(value);
            }
          }}
          filterAssignedUser={filterAssignedUser}
          onFilterAssignedUserChange={createFilterChangeHandler(setFilterAssignedUser)}
          userData={userData}
          onBulkUpdate={handleBulkUpdate}
          billingPeriods={billingPeriods}
        />

        {/* Nút đồng bộ + dọn mã trùng */}
        {filterCollection === "duplicates" && (
          <Box sx={{ mt: 1, display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<SyncIcon />}
              onClick={async () => {
                if (!confirm("Đồng bộ thông tin (tên KH, địa chỉ, mã trạm, SĐT, tỉnh) giữa các hóa đơn cùng mã KH — copy field trống từ 'anh em' có dữ liệu. Tiếp tục?")) return;
                const t = toast.loading("Đang đồng bộ mã trùng...");
                try {
                  const res = await syncDuplicateInvoices_API();
                  toast.dismiss(t);
                  toast.success(res.data?.message || "Đã đồng bộ.");
                  reloadInvoices();
                } catch (e: any) {
                  toast.dismiss(t);
                  toast.error(e?.response?.data?.message || "Đồng bộ thất bại.");
                }
              }}
            >
              Đồng bộ thông tin mã trùng
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={async () => {
                if (!confirm("Xóa bớt hóa đơn trùng đã đồng bộ giống hệt nhau và CHƯA tương tác (chưa thu, chưa in, chưa đóng cước). Hành động này không hoàn tác được. Tiếp tục?")) return;
                const t = toast.loading("Đang dọn mã trùng...");
                try {
                  const res = await cleanupRedundantDuplicates_API();
                  toast.dismiss(t);
                  toast.success(res.data?.message || "Đã dọn.");
                  reloadInvoices();
                } catch (e: any) {
                  toast.dismiss(t);
                  toast.error(e?.response?.data?.message || "Dọn thất bại.");
                }
              }}
            >
              Xóa mã trùng chưa tương tác
            </Button>
          </Box>
        )}

        {/* === SUMMARY === */}
        <InvoiceSummary
          filterAssignedUser={filterAssignedUser}
          totalUsers={userData.length}
          assignedCustomerCodes={assignedCustomerCodes}
          unassignedCustomerCodes={unassignedCustomerCodes}
          totalAmountInfo={totalAmountInfo}
          collected={collectSummary?.collected}
          notCollected={collectSummary?.notCollected}
          isPaid={collectSummary?.isPaid}
        />

        {/* === DATA TABLE === */}
        <Box sx={{ overflowX: "auto" }}>
          <InvoiceTable
            loading={loading}
            invoices={invoices}
            duplicateInvoiceNumbers={duplicateInvoiceNumbers}
            selectedInvoices={selectedInvoices}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            currentPage={currentPage}
            invoicesPerPage={invoicesPerPage}
            onToggleStatus={handleToggle}
            onToggleIsPaid={handleToggleIsPaid}
            onMenuOpen={handleMenuOpen}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onFetchAllData={fetchAllInvoicesForCopy}
          />

          {/* --- Phân trang --- */}
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
      </Box>

      {/* === ACTION MENU === */}
      <InvoiceActionMenu
        anchorEl={anchorEl}
        selectedInvoice={selectedInvoice}
        onClose={handleMenuClose}
        onEdit={handleEditInvoice}
        onDeleteSuccess={reloadInvoices}
      />

      {/* === DIALOGS KHÁC === */}
      <AddInvoiceDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => {
          reloadInvoices();
          toast.success("Thêm hoá đơn thành công!");
        }}
        assignedUsers={userData}
      />

      <EditInvoiceDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        invoice={editingInvoice}
        onSuccess={handleEditSuccess}
        assignedUsers={userData}
      />

      <UploadInvoiceWithProvinceDialog
        open={openUploadWithProvince}
        onClose={() => setOpenUploadWithProvince(false)}
        onSuccess={reloadInvoices}
        userData={userData}
      />

      <UploadPaidInvoicesDialog
        open={openUploadpaidInvoice}
        onClose={() => setOpenUploadPaidInvoice(false)}
        onSuccess={() => {
          reloadInvoices();
        }}
      />

      <DeleteAllInvoicesDialog
        open={openDeleteAllModal}
        onClose={() => setOpenDeleteAllModal(false)}
        billingPeriods={billingPeriods}
        onDeleteSuccess={reloadInvoices}
      />

      {/* === EXPORT MODALS (Tách ra) === */}
      <ExportModals
        userData={userData}
        openExportByUser={openExportByUser}
        selectedExportUser={selectedExportUser}
        setOpenExportByUser={setOpenExportByUser}
        setSelectedExportUser={setSelectedExportUser}
        handleExportByUserConfirm={handleExportByUserConfirm}
        openExportCollected={openExportCollected}
        setOpenExportCollected={setOpenExportCollected}
        handleExportCollectedConfirm={handleExportCollectedConfirm}
        collectedFromDate={collectedFromDate}
        setCollectedFromDate={setCollectedFromDate}
        collectedToDate={collectedToDate}
        setCollectedToDate={setCollectedToDate}
        selectedCollectedUsers={selectedCollectedUsers}
        setSelectedCollectedUsers={setSelectedCollectedUsers}
        collectedStatus={collectedStatus}
        setCollectedStatus={setCollectedStatus}
        closingStatus={closingStatus}
        setClosingStatus={setClosingStatus}
        openExportModal={openExportModal}
        setOpenExportModal={setOpenExportModal}
        handleExportConfirm={handleExportConfirm}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        collectionStatus={collectionStatus}
        setCollectionStatus={setCollectionStatus}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
      />
    </ProtectedRoute>
  );
}
