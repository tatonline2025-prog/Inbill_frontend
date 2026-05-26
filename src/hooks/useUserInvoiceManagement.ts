// hooks/useUserInvoiceManagement.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collectSummaryAPI,
  deleteInvoice_API,
  fetchuserinvoices,
  handleToggle_API,
  handleToggleIsPaid_API,
} from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { IUser } from "@/types/user"; // Giả định IUser được import
import toast from "react-hot-toast";
import { SelectChangeEvent } from "@mui/material";
import { CollectionSummaryProps } from "@/components/invoices/CollectionSummary";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { toDateKeyVN, toISOStringVN } from "@/lib/date-vn";

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
  user?: IUser | null;
}

export const useUserInvoiceManagement = ({ user }: UseUserInvoiceManagementProps) => {
  // --- Data & Loading States ---
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [collectSummary, setCollectSummary] = useState<CollectionSummaryProps>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // --- State Tìm kiếm ---

  const [searchType, setSearchType] = useState<SearchType>("customerCode");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500); // --- Filter States ---

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [isPaidFilter, setIsPaidFilter] = useState(false);
  // --- Pagination States ---

  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(30);
  const [totalPages, setTotalPages] = useState(1); // --- Summary States ---

  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(0);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(0);
  const [totalAmountInfo, setTotalAmountInfo] = useState(0); // --- Action & Modal States ---

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openExportCollected, setOpenExportCollected] = useState(false);
  const [openExportAllModal, setOpenExportAllModal] = useState(false);

  const today = toDateKeyVN();
  const [selectedCollectedDate, setSelectedCollectedDate] = useState(today);

  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none");

  const [collectedFromDate, setCollectedFromDate] = useState(today); // Từ ngày
  const [collectedToDate, setCollectedToDate] = useState(today); // Đến ngày

  const [collectedStatus, setCollectedStatus] = useState("paid");
  const [closingStatus, setClosingStatus] = useState("false");

  const [allCollectionStatus, setAllCollectionStatus] = useState("paid");
  const [allPaymentStatus, setAllPaymentStatus] = useState("false");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    const sortFieldToSend = sortDirection !== "none" ? sortField : undefined;
    const sortDirectionToSend = sortDirection !== "none" ? sortDirection : undefined;

    const searchParams: { customerCode?: string; stationCode?: string } = {}; // DĂ¹ng debouncedSearchValue

    if (debouncedSearchValue) {
      if (searchType === "customerCode") {
        searchParams.customerCode = debouncedSearchValue;
      } else if (searchType === "stationCode") {
        searchParams.stationCode = debouncedSearchValue;
      }
    }
    try {
      const res = await fetchuserinvoices(
        currentPage,
        invoicesPerPage,
        filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
        filterCollection !== "all" ? (filterCollection === "not_collected" ? "not_collected" : "collected") : undefined,
        undefined,
        searchParams.customerCode,
        searchParams.stationCode,
        undefined,
        sortFieldToSend,
        sortDirectionToSend,
        isPaidFilter
      );

      setTotalPages(res.data.pagination.totalPages);
      setAssignedCustomerCodes(res.data.summary.assignedCustomerCodes ?? res.data.summary.totalInvoices);
      setUnAssignedCustomerCodes(res.data.summary.unassignedCustomerCodes || 0);
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
    debouncedSearchValue,
    searchType,
    sortField,
    sortDirection,
    isPaidFilter,
  ]);

  const fetchCollectSummary = useCallback(async () => {
    setLoading(true);

    try {
      const res = await collectSummaryAPI(user?._id);

      if (res?.success) {
        setCollectSummary(res.data);
      } else {
        console.error("Lỗi lấy dữ liệu:", res?.message);
      }
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const reloadInvoices = () => {
    fetchInvoices();
    fetchCollectSummary();
  };

  useEffect(() => {
    if (!user?._id) return;
    fetchInvoices();
    fetchCollectSummary();
  }, [fetchCollectSummary, fetchInvoices, user?._id]);

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

  const handleIsPaidFilterChange = (checked: boolean) => {
    setIsPaidFilter(checked);
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
  };

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
    const targetInvoice = invoices.find((inv) => inv._id === invoiceId);
    if (!targetInvoice) return;

    try {
      if (field === "printStatus") {
        await handleToggle_API(invoiceId, field);
        setInvoices((prev) =>
          prev.map((inv) =>
            inv._id === invoiceId
              ? {
                  ...inv,
                  printStatus: inv.printStatus === "printed" ? "not_printed" : "printed",
                }
              : inv
          )
        );
        return;
      }

      // Nhánh user không có switch "Đã đóng cước" để bật,
      // nhưng khi bật/tắt "Đã thu" vẫn phải ép "Đã đóng cước" về false.
      const nextCollectionStatus =
        targetInvoice.collectionStatus === "collected" ? "not_collected" : "collected";
      const nextIsPaid = false;

      if (targetInvoice.collectionStatus !== nextCollectionStatus) {
        await handleToggle_API(invoiceId, "collectionStatus");
      }
      if ((targetInvoice.isPaid ?? false) !== nextIsPaid) {
        await handleToggleIsPaid_API(invoiceId);
      }

      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === invoiceId
            ? {
                ...inv,
                collectionStatus: nextCollectionStatus,
                isPaid: nextIsPaid,
                collectionDate: nextCollectionStatus === "collected" ? toISOStringVN() : null,
              }
            : inv
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái!");
      reloadInvoices();
    }
  };

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

  const handleExport = async (collStatus: string, payStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui long dang nhap lai");
      return;
    }
        const params = new URLSearchParams();

    // Chỉ append nếu người dùng chọn khác "Tất cả" (hoặc append "all" tùy backend xử lý)
    if (filterCollection !== "all") {
      params.append("collectionStatus", filterCollection);
    } else if (collStatus !== "all") {
      params.append("collectionStatus", collStatus);
    }
    if (isPaidFilter) {
      params.append("isPaid", "true");
    } else if (payStatus !== "all") {
      params.append("paymentStatus", payStatus);
    }
    if (filterPrint !== "all") {
      params.append("printStatus", filterPrint);
    }
    if (searchValue) {
      if (searchType === "customerCode") {
        params.append("customerCode", searchValue);
      } else if (searchType === "stationCode") {
        params.append("stationCode", searchValue);
      }
    }
    if (sortField && sortDirection !== "none") {
      params.append("sortField", sortField);
      params.append("sortDirection", sortDirection === "asc" ? "1" : "-1");
    }

    const apiUrl = `${getApiBaseUrl()}/api/invoices/exportExcel?${params.toString()}`;
    try {
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) {
        const errorData = await response.json();
        toast.error(errorData.message || "Co loi xay ra khi xuat file.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename=\"(.+)\"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : "danh-sach-hoa-don.xlsx";
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Loi khi xuat file:", error);
      toast.error("Khong the ket noi toi may chu de xuat file.");
    }
  };

  const handleOpenExportCollected = () => {
    setOpenExportCollected(true);
  };

  const handleExportCollectedConfirm = async () => {
    if (!user) {
      toast.error("Không tìm thấy thông tin người dùng.");
      return;
    }
    if (user.role !== "admin") {
      toast.error("Chuc nang nay chi danh cho admin.");
      return;
    }

    if (!collectedFromDate || !collectedToDate) {
      toast.error("Vui lòng chọn khoảng thời gian (Từ ngày - Đến ngày)!");
      return;
    }

    const params = new URLSearchParams({
      fromDate: collectedFromDate,
      toDate: collectedToDate,
      status: collectedStatus,
      isClosed: closingStatus,
      date: selectedCollectedDate,
      userIds: user._id, // Tự động lấy user ID
    });

    if (sortField && sortDirection !== "none") {
      params.append("sortField", sortField);
      params.append("sortDirection", sortDirection === "asc" ? "1" : "-1");
    }

    const apiUrl = `${getApiBaseUrl()}/api/invoices/exportExcelCollected?${params.toString()}`;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui long dang nhap lai");
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    } catch (error) {
      console.error("Lỗi khi xuất file:", error);
      alert("Không thể kết nối tới máy chủ để xuất file.");
    }
  };

  const handleAddSuccess = () => {
    setOpenAddDialog(false);
    reloadInvoices();
    toast.success("Thêm hoá đơn thành công!");
  };

  const handleEditSuccess = (updatedInvoice?: InvoiceInfo) => {
    setEditModalOpen(false);

    // Cập nhật ngay trên list hiện tại để giữ nguyên page/vị trí đang xem.
    if (updatedInvoice?._id) {
      setInvoices((prev) => prev.map((inv) => (inv._id === updatedInvoice._id ? { ...inv, ...updatedInvoice } : inv)));
      setSelectedInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      setEditingInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      return;
    }

    // Fallback nếu backend không trả lại object invoice đầy đủ
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
    setIsPaidFilter,
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
    setAllPaymentStatus,
  };
};






