"use client";

import { Box, Button, Pagination } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import toast from "react-hot-toast";

import ProtectedRoute from "@/components/ProtectedRoute";
import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import UploadInvoiceWithProvinceDialog from "@/components/UploadInvoiceWithProvinceDialog";
import UploadPaidInvoicesDialog from "@/components/UploadPaidInvoicesDialog";
import DeleteAllInvoicesDialog from "@/components/invoices/DeleteAllInvoicesDialog";
import InvoiceToolbar from "@/components/invoices/InvoiceToolbar";
import InvoiceSummary from "@/components/invoices/InvoiceSummary";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceActionMenu from "@/components/invoices/InvoiceActionMenu";
import ExportModals from "@/components/invoices/ExportModals";
import { useInvoiceManagement } from "@/hooks/useInvoiceManagement";
import { toDateKeyVN } from "@/lib/date-vn";
import {
  cleanupRedundantDuplicates_API,
  fetchInvoicesForCopyAPI,
  syncDuplicateInvoices_API,
} from "@/services/invoice.api";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = error as { response?: { data?: { message?: unknown } }; message?: unknown };
    if (typeof maybeResponse.response?.data?.message === "string") return maybeResponse.response.data.message;
    if (typeof maybeResponse.message === "string") return maybeResponse.message;
  }
  return fallback;
};

export default function InvoicesPage() {
  const {
    invoices,
    duplicateInvoiceNumbers,
    invoiceNumberStatuses,
    collectSummary,
    userData,
    filteredAssignedUsers,
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
    selectedAreaPrefixes,
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
    areaOptions,
    setFilterPrint,
    setFilterAssignedUser,
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
    handleAreaFilterChange,
    handleCollectionFilterChange,
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

  if (error) {
    return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;
  }

  const fetchAllInvoicesForCopy = async () => {
    return fetchInvoicesForCopyAPI(
      filterPrint,
      filterCollection,
      filterAssignedUser,
      isPaidFilter,
      selectedProvince,
      selectedAreaPrefixes.length > 0 ? selectedAreaPrefixes.join(",") : undefined,
      searchType,
      searchValue.trim(),
      filterCollection === "collected_today" ? toDateKeyVN() : undefined
    );
  };

  return (
    <ProtectedRoute fallback={<p>Đang chuyển hướng...</p>}>
      <Box sx={{ p: 4 }}>
        <InvoiceToolbar
          invoicesCount={invoices.length}
          onExport={handleExportPrinted}
          invoicesPerPage={invoicesPerPage}
          onInvoicesPerPageChange={handleInvoicesPerPageChange}
          onOpenAddDialog={() => setOpenAddDialog(true)}
          selectedInvoicesCount={selectedInvoices.length}
          onDeleteSelected={handleDeleteSelected}
          onOpenDeleteAllModal={() => setOpenDeleteAllModal(true)}
          onOpenUploadWithProvince={() => setOpenUploadWithProvince(true)}
          onOpenUploadPaidInvoices={() => setOpenUploadPaidInvoice(true)}
          areaOptions={areaOptions}
          selectedAreaPrefixes={selectedAreaPrefixes}
          onSelectedAreaPrefixesChange={handleAreaFilterChange}
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onOpenExportByUser={() => setOpenExportByUser(true)}
          onBulkSearch={handleBulkSearch}
          filterPrint={filterPrint}
          onFilterPrintChange={createFilterChangeHandler(setFilterPrint)}
          filterCollection={isPaidFilter ? "is_paid" : filterCollection}
          onFilterCollectionChange={handleCollectionFilterChange}
          filterAssignedUser={filterAssignedUser}
          onFilterAssignedUserChange={createFilterChangeHandler(setFilterAssignedUser)}
          userData={filteredAssignedUsers}
          onBulkUpdate={handleBulkUpdate}
          billingPeriods={billingPeriods}
        />

        {filterCollection === "duplicates" && (
          <Box sx={{ mt: 1, display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<SyncIcon />}
              onClick={async () => {
                if (
                  !confirm(
                    "Đồng bộ thông tin còn thiếu giữa các hóa đơn giống mã KH. Các hóa đơn khác kỳ hoặc khác người phụ trách sẽ vẫn được giữ riêng. Tiếp tục?"
                  )
                ) {
                  return;
                }

                const loadingToast = toast.loading("Đang đồng bộ thông tin giống mã KH...");
                try {
                  const res = await syncDuplicateInvoices_API();
                  toast.dismiss(loadingToast);
                  toast.success(res.data?.message || "Đã đồng bộ.");
                  reloadInvoices();
                } catch (submitError: unknown) {
                  toast.dismiss(loadingToast);
                  toast.error(getErrorMessage(submitError, "Đồng bộ thất bại."));
                }
              }}
            >
              Đồng bộ thông tin giống mã KH
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={async () => {
                if (
                  !confirm(
                    "Chỉ xóa các hóa đơn trùng thực sự sau khi đã đồng bộ, ưu tiên xóa bản ghi chưa tương tác. Tiếp tục?"
                  )
                ) {
                  return;
                }

                const loadingToast = toast.loading("Đang dọn hóa đơn trùng thực sự...");
                try {
                  const res = await cleanupRedundantDuplicates_API();
                  toast.dismiss(loadingToast);
                  toast.success(res.data?.message || "Đã dọn.");
                  reloadInvoices();
                } catch (submitError: unknown) {
                  toast.dismiss(loadingToast);
                  toast.error(getErrorMessage(submitError, "Dọn trùng thất bại."));
                }
              }}
            >
              Xóa trùng hóa đơn chưa tương tác
            </Button>
          </Box>
        )}

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

        <Box sx={{ overflowX: "auto" }}>
          <InvoiceTable
            loading={loading}
            invoices={invoices}
            duplicateInvoiceNumbers={duplicateInvoiceNumbers}
            invoiceNumberStatuses={invoiceNumberStatuses}
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

      <InvoiceActionMenu
        anchorEl={anchorEl}
        selectedInvoice={selectedInvoice}
        onClose={handleMenuClose}
        onEdit={handleEditInvoice}
        onDeleteSuccess={reloadInvoices}
      />

      <AddInvoiceDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => {
          reloadInvoices();
          toast.success("Thêm hóa đơn thành công!");
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
        onSuccess={reloadInvoices}
      />

      <DeleteAllInvoicesDialog
        open={openDeleteAllModal}
        onClose={() => setOpenDeleteAllModal(false)}
        billingPeriods={billingPeriods}
        onDeleteSuccess={reloadInvoices}
      />

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
