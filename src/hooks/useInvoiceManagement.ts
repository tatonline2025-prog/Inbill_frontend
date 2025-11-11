// hooks/useInvoiceManagement.ts

import { useEffect, useMemo, useState } from "react";
import { deleteInvoice_API, fetchallInvoice, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";
import toast from "react-hot-toast";

// Import hằng số
import { PROVINCES, generateBillingPeriods } from "@/constants/invoice.constants";

type SearchType = "customerCode" | "stationCode";
type SortDirection = "asc" | "desc" | "none";

// Custom hook Debounce (tạm thời đặt ở đây)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useInvoiceManagement = () => {
  // --- State Dữ liệu chính ---
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [userData, setUserData] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State Phân trang & Tóm tắt ---
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(0);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(0);
  const [totalAmountInfo, setTotalAmountInfo] = useState(0);

  // --- State Bộ lọc ---
  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");

  // --- State Tìm kiếm & Sắp xếp ---
  const [searchType, setSearchType] = useState<SearchType>("customerCode");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500); // 500ms debounce

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none");

  // --- State Hành động & Modal ---
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteAllModal, setOpenDeleteAllModal] = useState(false);
  const [openUploadWithProvince, setOpenUploadWithProvince] = useState(false);

  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);

  const [openExportByUser, setOpenExportByUser] = useState(false);
  const [selectedExportUser, setSelectedExportUser] = useState<string>("");

  const [openExportCollected, setOpenExportCollected] = useState(false);
  const [selectedCollectedDate, setSelectedCollectedDate] = useState("");
  const [selectedCollectedUser, setSelectedCollectedUser] = useState("all");

  // --- Hằng số ---
  const billingPeriods = useMemo(() => generateBillingPeriods(), []);
  const provinces = useMemo(() => PROVINCES, []);

  // --- Logic Fetch Dữ liệu ---

  const fetchInvoices = async (page = currentPage, perPage = invoicesPerPage) => {
    try {
      setLoading(true);
      setError(null);

      const sortFieldToSend = sortDirection !== "none" ? sortField : undefined;
      const sortDirectionToSend = sortDirection !== "none" ? sortDirection : undefined;

      const searchParams: { customerCode?: string; stationCode?: string } = {};

      if (debouncedSearchValue) {
        if (searchType === "customerCode") {
          searchParams.customerCode = debouncedSearchValue;
        } else if (searchType === "stationCode") {
          searchParams.stationCode = debouncedSearchValue;
        }
      }

      const res = await fetchallInvoice(
        page,
        perPage,
        filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
        filterCollection !== "all" ? (filterCollection === "notCollected" ? "not_collected" : "collected") : undefined,
        filterAssignedUser !== "all" ? filterAssignedUser : undefined,
        selectedProvince !== "all" ? selectedProvince : undefined,
        searchParams.customerCode,
        searchParams.stationCode,
        undefined, // userprovince
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
  };

  const reloadInvoices = () => {
    fetchInvoices(currentPage, invoicesPerPage);
  };

  // --- Effects ---

  // 1. Fetch danh sách User
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

  // 2. Fetch danh sách Invoice khi filters, pagination, sort, search thay đổi
  useEffect(() => {
    fetchInvoices(currentPage, invoicesPerPage);
  }, [
    currentPage,
    invoicesPerPage,
    filterPrint,
    filterCollection,
    filterAssignedUser,
    selectedProvince,
    debouncedSearchValue, // Kích hoạt tìm kiếm trì hoãn
    searchType,
    sortField,
    sortDirection,
  ]);

  // --- Handlers ---

  const createFilterChangeHandler = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
    };
  };

  const handleInvoicesPerPageChange = (value: number) => {
    setInvoicesPerPage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    if (value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  // Tìm kiếm
  const handleSearchTypeChange = (newType: SearchType) => {
    setSearchType(newType);
    setSearchValue("");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // KHÔNG setCurrentPage(1) ở đây để input không bị giật,
    // việc gọi API và reset page sẽ do useEffect(debouncedSearchValue) đảm nhiệm
  };

  // Sắp xếp
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

  // Tác vụ dòng
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: InvoiceInfo) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleEditInvoice = (invoice: InvoiceInfo) => {
    setEditingInvoice(invoice);
    setEditModalOpen(true);
  };

  // Tác vụ Xóa
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

  // Tác vụ Chọn
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

  // Tác vụ Toggle
  const handleToggle = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
    try {
      await handleToggle_API(invoiceId, field);
      // Cập nhật state cục bộ để UI phản hồi nhanh hơn
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
  };

  // --- Hàm Export (Vẫn giữ lại logic trong hook để dễ quản lý state modal) ---
  const handleExport = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcel`;
  };

  const handleExportPrinted = () => {
    setOpenExportCollected(true);
  };

  const handleExportByUserConfirm = async () => {
    // (Giữ nguyên logic ExportByUserConfirm)
    if (!selectedExportUser) {
      alert("Vui lòng chọn người phụ trách!");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/exportExcelByUser?assignedUserId=${selectedExportUser}`
      );
      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) {
        const errorData = await response.json();
        alert(errorData.message || "Có lỗi xảy ra khi xuất file.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : "danh-sach-hoa-don.xlsx";
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setOpenExportByUser(false);
    } catch (error) {
      console.error("Lỗi khi xuất file:", error);
      alert("Không thể kết nối tới máy chủ để xuất file.");
    }
  };

  const handleExportCollectedConfirm = async () => {
    // (Giữ nguyên logic ExportCollectedConfirm)
    if (!selectedCollectedDate) {
      alert("Vui lòng chọn ngày thu!");
      return;
    }

    const params = new URLSearchParams({
      date: selectedCollectedDate,
    });
    if (selectedCollectedUser !== "all") {
      params.append("assignedUserId", selectedCollectedUser);
    }
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
      setSelectedCollectedUser("all");
    } catch (error) {
      console.error("Lỗi khi xuất file:", error);
      alert("Không thể kết nối tới máy chủ để xuất file.");
    }
  };

  return {
    // State
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

    // Hằng số
    billingPeriods,
    provinces,

    // Setters
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

    // Handlers
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
  };
};
