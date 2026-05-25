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
    selectedAreaPrefix,
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
    setSelectedAreaPrefix,
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
      selectedAreaPrefix,
      searchType,
      searchValue.trim(),
      filterCollection === "collected_today" ? toDateKeyVN() : undefined
    );
  };

  return (
    <ProtectedRoute fallback={<p>Redirecting...</p>}>
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
          selectedAreaPrefix={selectedAreaPrefix}
          onSelectedAreaPrefixChange={createFilterChangeHandler(setSelectedAreaPrefix)}
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
          userData={userData}
          onBulkUpdate={handleBulkUpdate}
          billingPeriods={billingPeriods}
        />

        {filterCollection === "duplicates" && (
          <Box sx={{ mt: 1, display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<SyncIcon />}
              onClick={async () => {
                if (!confirm("Dong bo thong tin giua cac hoa don trung ma KH. Tiep tuc?")) return;
                const loadingToast = toast.loading("Dang dong bo ma trung...");
                try {
                  const res = await syncDuplicateInvoices_API();
                  toast.dismiss(loadingToast);
                  toast.success(res.data?.message || "Da dong bo.");
                  reloadInvoices();
                } catch (submitError: unknown) {
                  toast.dismiss(loadingToast);
                  toast.error(getErrorMessage(submitError, "Dong bo that bai."));
                }
              }}
            >
              Dong bo thong tin ma trung
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={async () => {
                if (!confirm("Xoa bot hoa don trung da dong bo giong nhau va chua tuong tac. Tiep tuc?")) return;
                const loadingToast = toast.loading("Dang don ma trung...");
                try {
                  const res = await cleanupRedundantDuplicates_API();
                  toast.dismiss(loadingToast);
                  toast.success(res.data?.message || "Da don.");
                  reloadInvoices();
                } catch (submitError: unknown) {
                  toast.dismiss(loadingToast);
                  toast.error(getErrorMessage(submitError, "Don that bai."));
                }
              }}
            >
              Xoa ma trung chua tuong tac
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
          toast.success("Them hoa don thanh cong!");
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
