// app/admin/invoices/page.tsx

"use client";

import { Box, Pagination, Typography } from "@mui/material";
import AdminRoute from "@/components/AdminRoute";
import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import UploadInvoiceWithProvinceDialog from "@/components/UploadInvoiceWithProvinceDialog";
import DeleteAllInvoicesDialog from "@/components/invoices/DeleteAllInvoicesDialog";

// Import Custom Hook
import { useInvoiceManagement } from "@/hooks/useInvoiceManagement";

// Import các component con
import InvoiceToolbar from "@/components/invoices/InvoiceToolbar";
import InvoiceFilterBar from "@/components/invoices/InvoiceFilterBar";
import InvoiceSummary from "@/components/invoices/InvoiceSummary";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceActionMenu from "@/components/invoices/InvoiceActionMenu";
import ExportModals from "@/components/invoices/ExportModals"; // Component mới

export default function InvoicesPage() {
  // 💡 Sử dụng Custom Hook để lấy toàn bộ state và handlers
  const {
    invoices,
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
    selectedProvince,
    searchType,
    searchValue,
    sortField,
    sortDirection,
    openAddDialog,
    openDeleteAllModal,
    openUploadWithProvince,
    editingInvoice,
    editModalOpen,
    selectedInvoices,
    anchorEl,
    selectedInvoice,
    openExportByUser,
    selectedExportUser,
    openExportCollected,
    selectedCollectedDate,
    selectedCollectedUser,

    billingPeriods,
    provinces,

    setFilterPrint,
    setFilterCollection,
    setFilterAssignedUser,
    setSelectedProvince,
    setOpenAddDialog,
    setEditModalOpen,
    setOpenDeleteAllModal,
    setOpenUploadWithProvince,
    setSelectedExportUser,
    setOpenExportByUser,
    setSelectedCollectedDate,
    setSelectedCollectedUser,
    setOpenExportCollected,

    reloadInvoices,
    handleInvoicesPerPageChange,
    handlePageChange,
    createFilterChangeHandler,
    handleSearchTypeChange,
    handleSearchChange,
    handleSort,
    handleMenuOpen,
    handleMenuClose,
    handleEditInvoice,
    handleDeleteSelected,
    handleSelectAll,
    handleSelectOne,
    handleToggle,
    handleExport,
    handleExportPrinted,
    handleExportByUserConfirm,
    handleExportCollectedConfirm,
  } = useInvoiceManagement();

  if (error) return <p style={{ padding: "2rem", color: "red" }}>{error}</p>;

  return (
    <AdminRoute fallback={<p>Redirecting...</p>}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Danh Sách Hóa Đơn
        </Typography>

        {/* === TOOLBAR === */}
        <InvoiceToolbar
          invoicesCount={invoices.length}
          onExport={handleExport}
          onExportPrinted={handleExportPrinted}
          invoicesPerPage={invoicesPerPage}
          onInvoicesPerPageChange={handleInvoicesPerPageChange}
          onOpenAddDialog={() => setOpenAddDialog(true)}
          selectedInvoicesCount={selectedInvoices.length}
          onDeleteSelected={handleDeleteSelected}
          onOpenDeleteAllModal={() => setOpenDeleteAllModal(true)}
          onOpenUploadWithProvince={() => setOpenUploadWithProvince(true)}
          searchType={searchType}
          onSearchTypeChange={handleSearchTypeChange}
          searchValue={searchValue} // Dùng searchValue
          onSearchChange={handleSearchChange}
          onOpenExportByUser={() => setOpenExportByUser(true)}
        />

        {/* === FILTER BAR === */}
        <InvoiceFilterBar
          filterPrint={filterPrint}
          onFilterPrintChange={createFilterChangeHandler(setFilterPrint)}
          filterCollection={filterCollection}
          onFilterCollectionChange={createFilterChangeHandler(setFilterCollection)}
          filterAssignedUser={filterAssignedUser}
          onFilterAssignedUserChange={createFilterChangeHandler(setFilterAssignedUser)}
          selectedProvince={selectedProvince}
          onSelectedProvinceChange={createFilterChangeHandler(setSelectedProvince)}
          userData={userData}
          provinces={provinces}
        />

        {/* === SUMMARY === */}
        <InvoiceSummary
          filterAssignedUser={filterAssignedUser}
          totalUsers={userData.length}
          assignedCustomerCodes={assignedCustomerCodes}
          unassignedCustomerCodes={unassignedCustomerCodes}
          totalAmountInfo={totalAmountInfo}
        />

        {/* === DATA TABLE === */}
        <Box sx={{ overflowX: "auto" }}>
          <InvoiceTable
            loading={loading}
            invoices={invoices}
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
          // toast.success("Thêm hoá đơn thành công!"); // Có thể thêm toast nếu bạn muốn
        }}
        assignedUsers={userData}
      />

      <EditInvoiceDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        invoice={editingInvoice}
        onSuccess={reloadInvoices}
        assignedUsers={userData}
      />

      <UploadInvoiceWithProvinceDialog
        open={openUploadWithProvince}
        onClose={() => setOpenUploadWithProvince(false)}
        onSuccess={(data) => {
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
        selectedCollectedDate={selectedCollectedDate}
        selectedCollectedUser={selectedCollectedUser}
        setOpenExportCollected={setOpenExportCollected}
        setSelectedCollectedDate={setSelectedCollectedDate}
        setSelectedCollectedUser={setSelectedCollectedUser}
        handleExportCollectedConfirm={handleExportCollectedConfirm}
      />
    </AdminRoute>
  );
}
