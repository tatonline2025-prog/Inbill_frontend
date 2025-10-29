// app/admin/invoices/page.tsx (Đã refactor)

"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteInvoice_API, fetchallInvoice, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import AdminRoute from "@/components/AdminRoute";
import { Box, Pagination, Typography } from "@mui/material";
import AddInvoiceDialog from "@/components/AddInvoiceDialog";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";
import toast from "react-hot-toast";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import UploadInvoiceWithProvinceDialog from "@/components/UploadInvoiceWithProvinceDialog";

// Import hằng số
import { PROVINCES, generateBillingPeriods } from "@/constants/invoice.constants";

// Import các component con
import InvoiceToolbar from "@/components/invoices/InvoiceToolbar";
import InvoiceFilterBar from "@/components/invoices/InvoiceFilterBar";
import InvoiceSummary from "@/components/invoices/InvoiceSummary";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceActionMenu from "@/components/invoices/InvoiceActionMenu";
import DeleteAllInvoicesDialog from "@/components/invoices/DeleteAllInvoicesDialog";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [userData, setUserData] = useState<IUser[]>([]);

  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [openDeleteAllModal, setOpenDeleteAllModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(0);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(0);

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");

  const [openUploadWithProvince, setOpenUploadWithProvince] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [totalAmountInfo, setTotalAmountInfo] = useState(0);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  // Lấy hằng số bằng useMemo
  const billingPeriods = useMemo(() => generateBillingPeriods(), []);
  const provinces = useMemo(() => PROVINCES, []);

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
        const filterUser = res.data.user.filter((user) => user.role === "user");
        setUserData(filterUser);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const fetchInvoices = async (page = currentPage, perPage = invoicesPerPage) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchallInvoice(
        page,
        perPage,
        filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
        filterCollection !== "all" ? (filterCollection === "notCollected" ? "not_collected" : "collected") : undefined,
        filterAssignedUser !== "all" ? filterAssignedUser : undefined,
        selectedProvince !== "all" ? selectedProvince : undefined,
        searchInvoiceNumber || undefined
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
  };

  // --- Fetch Invoices Effect ---
  useEffect(() => {
    fetchInvoices(currentPage, invoicesPerPage);
  }, [
    currentPage,
    invoicesPerPage,
    filterPrint,
    filterCollection,
    filterAssignedUser,
    selectedProvince,
    searchInvoiceNumber,
  ]);

  const reloadInvoices = () => {
    fetchInvoices(currentPage, invoicesPerPage);
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
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (value >= 1 && value <= totalPages) {
      setCurrentPage(value);
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

  // --- Xử lý filter ---
  const handleInvoicesPerPageChange = (value: number) => {
    setInvoicesPerPage(value);
    setCurrentPage(1);
  };

  const createFilterChangeHandler = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  };

  const handleSearchChange = (value: string) => {
    setSearchInvoiceNumber(value);
    setCurrentPage(1);
  };

  // --- Xử lý chọn (checkboxes) ---
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

  // --- Xử lý xoá ---
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

  // --- Xử lý sửa ---
  const handleEditInvoice = (invoice: InvoiceInfo) => {
    setEditingInvoice(invoice);
    setEditModalOpen(true);
  };

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
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          onExport={handleExport}
          onExportPrinted={handleExportPrinted}
          invoicesPerPage={invoicesPerPage}
          onInvoicesPerPageChange={handleInvoicesPerPageChange}
          onOpenAddDialog={() => setOpenAddDialog(true)}
          selectedInvoicesCount={selectedInvoices.length}
          onDeleteSelected={handleDeleteSelected}
          onOpenDeleteAllModal={() => setOpenDeleteAllModal(true)}
          onOpenUploadWithProvince={() => setOpenUploadWithProvince(true)}
          searchInvoiceNumber={searchInvoiceNumber}
          onSearchChange={handleSearchChange}
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

      {/* === DIALOGS === */}
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
        onSuccess={reloadInvoices}
        assignedUsers={userData}
      />

      <UploadInvoiceWithProvinceDialog
        open={openUploadWithProvince}
        onClose={() => setOpenUploadWithProvince(false)}
        onSuccess={(data) => {
          setInvoices(data); // Hoặc reload
          reloadInvoices();
        }}
      />

      <DeleteAllInvoicesDialog
        open={openDeleteAllModal}
        onClose={() => setOpenDeleteAllModal(false)}
        billingPeriods={billingPeriods}
        onDeleteSuccess={reloadInvoices}
      />
    </AdminRoute>
  );
}
