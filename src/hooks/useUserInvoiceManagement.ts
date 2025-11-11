// hooks/useUserInvoiceManagement.ts

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { deleteInvoice_API, fetchallInvoice, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { IUser } from "@/types/user"; // Giả định IUser được import
import toast from "react-hot-toast";
import { SelectChangeEvent } from "@mui/material";

type SearchType = "customerCode" | "stationCode";
type SortDirection = "asc" | "desc" | "none";

// Custom hook Debounce (Tách riêng nếu cần tái sử dụng ở nhiều nơi)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

interface UseUserInvoiceManagementProps {
  user: IUser;
}

export const useUserInvoiceManagement = ({ user }: UseUserInvoiceManagementProps) => {
  // --- Data & Loading States ---
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // --- State Tìm kiếm ---

  const [searchType, setSearchType] = useState<SearchType>("customerCode");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500); // --- Filter States ---

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all"); // --- Pagination States ---

  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1); // --- Summary States ---

  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(0);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(0);
  const [totalAmountInfo, setTotalAmountInfo] = useState(0); // --- Action & Modal States ---

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openExportCollected, setOpenExportCollected] = useState(false);
  const [selectedCollectedDate, setSelectedCollectedDate] = useState("");
  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null); // --- Sort States ---

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none"); // --- 1. Data Fetching ---

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    const sortFieldToSend = sortDirection !== "none" ? sortField : undefined;
    const sortDirectionToSend = sortDirection !== "none" ? sortDirection : undefined;

    const searchParams: { customerCode?: string; stationCode?: string } = {}; // Dùng debouncedSearchValue

    if (debouncedSearchValue) {
      if (searchType === "customerCode") {
        searchParams.customerCode = debouncedSearchValue;
      } else if (searchType === "stationCode") {
        searchParams.stationCode = debouncedSearchValue;
      }
    }
    try {
      const res = await fetchallInvoice(
        currentPage,
        invoicesPerPage,
        filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
        filterCollection !== "all" ? (filterCollection === "notCollected" ? "not_collected" : "collected") : undefined,
        user._id, // **GỬI USER ID CỦA NGƯỜI DÙNG HIỆN TẠI**
        selectedProvince !== "all" ? selectedProvince : undefined,
        searchParams.customerCode,
        searchParams.stationCode,
        user.province, // **GỬI PROVINCE CỦA NGƯỜI DÙNG HIỆN TẠI**
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
    debouncedSearchValue,
    searchType,
    sortField,
    sortDirection,
  ]);

  const reloadInvoices = () => {
    fetchInvoices();
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]); // --- 2. Event Handlers (UI/Sort) ---

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

  const onSearchChange = (value: string) => {
    setSearchValue(value); // KHÔNG reset page ở đây, debounce sẽ xử lý.
  };

  const handleSearchTypeChange = (e: SelectChangeEvent) => {
    setSearchType(e.target.value as SearchType);
    setSearchValue(""); // Reset giá trị tìm kiếm khi đổi loại
    setCurrentPage(1); // Reset page khi đổi loại
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
  }; // --- 3. Table Handlers (Select/Toggle/Delete) ---

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
      setSelectedInvoices([]);
      await reloadInvoices();
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
      toast.error("Lỗi khi cập nhật trạng thái!");
    }
  }; // --- 4. Menu Handlers ---

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
  }; // --- 5. Export Handlers ---

  const handleExport = () => {
    // Export file của riêng user này
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcel?assignedUserId=${user?._id}`;
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
  }; // --- 6. Dialog Close Handlers & Sort ---

  const handleAddSuccess = () => {
    setOpenAddDialog(false);
    reloadInvoices();
    toast.success("Thêm hoá đơn thành công!");
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    reloadInvoices();
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

  const searchLabel = searchType === "customerCode" ? "Tìm theo Mã khách hàng" : "Tìm theo Mã trạm";

  // --- RETURN OBJECT CỦA HOOK ---
  return {
    // States & Derived Values
    invoices,
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
    selectedProvince,
    searchType,
    searchValue,
    sortField,
    sortDirection,
    openAddDialog,
    openUploadDialog,
    openExportCollected,
    selectedCollectedDate,
    editingInvoice,
    editModalOpen,
    selectedInvoices,
    anchorEl,
    selectedInvoice,

    sortedInvoices,
    searchLabel,

    // Setters
    setFilterPrint,
    setFilterCollection,
    setSelectedProvince,
    setOpenAddDialog,
    setOpenUploadDialog,
    setOpenExportCollected,
    setSelectedCollectedDate,
    setEditModalOpen,

    // Handlers
    reloadInvoices,
    handlePageChange,
    handleRowsPerPageChange,
    handleFilterChange,
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
    handleAddSuccess,
    handleEditSuccess,
  };
};
