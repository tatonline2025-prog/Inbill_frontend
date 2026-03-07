// hooks/useInvoiceManagement.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collectSummaryAPI,
  deleteInvoice_API,
  fetchallInvoice,
  fetchInvoiceBylist,
  handleToggle_API,
  handleToggleIsPaid_API,
} from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";
import toast from "react-hot-toast";

// Import hằng số
import { PROVINCES, generateBillingPeriods } from "@/constants/invoice.constants";
import { CollectionSummaryProps } from "@/components/invoices/CollectionSummary";
import { getApiBaseUrl } from "@/lib/api-base-url";

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
  const [collectSummary, setCollectSummary] = useState<CollectionSummaryProps>();
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
  const [isPaidFilter, setIsPaidFilter] = useState(false);

  // --- State Tìm kiếm & Sắp xếp ---
  const [searchType, setSearchType] = useState<SearchType>("customerCode");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500); // 500ms debounce

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none");

  // --- State Bulk Search ---
  const [isBulkSearchActive, setIsBulkSearchActive] = useState(false);
  const [bulkSearchCodes, setBulkSearchCodes] = useState<string[]>([]);

  // --- State Hành động & Modal ---
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteAllModal, setOpenDeleteAllModal] = useState(false);
  const [openUploadWithProvince, setOpenUploadWithProvince] = useState(false);
  const [openUploadpaidInvoice, setOpenUploadPaidInvoice] = useState(false);

  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);

  // --- Export By User ---
  const [openExportByUser, setOpenExportByUser] = useState(false);
  const [selectedExportUser, setSelectedExportUser] = useState<string>("");

  // --- Export Collected ---
  const [openExportCollected, setOpenExportCollected] = useState(false);
  const [openExportModal, setOpenExportModal] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [collectionStatus, setCollectionStatus] = useState<string>("paid");
  const [paymentStatus, setPaymentStatus] = useState<string>("false");

  const today = new Date().toLocaleDateString("en-CA");
  const [collectedFromDate, setCollectedFromDate] = useState<string>(today);
  const [collectedToDate, setCollectedToDate] = useState<string>(today);
  const [selectedCollectedUsers, setSelectedCollectedUsers] = useState<string[]>([]);
  const [collectedStatus, setCollectedStatus] = useState<string>("paid");
  const [closingStatus, setClosingStatus] = useState<string>("false");

  // --- Hằng số ---
  const billingPeriods = useMemo(() => generateBillingPeriods(), []);
  const provinces = useMemo(() => PROVINCES, []);

  // --- Logic Fetch Dữ liệu ---

  const fetchInvoices = useCallback(async (page = currentPage, perPage = invoicesPerPage) => {
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
        filterCollection !== "all" ? (filterCollection === "not_collected" ? "not_collected" : "collected") : undefined,
        filterAssignedUser !== "all" ? filterAssignedUser : undefined,
        selectedProvince !== "all" ? selectedProvince : undefined,
        searchParams.customerCode,
        searchParams.stationCode,
        undefined, // userprovince
        sortFieldToSend,
        sortDirectionToSend,
        isPaidFilter
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
    currentPage,
    invoicesPerPage,
    sortDirection,
    sortField,
    debouncedSearchValue,
    searchType,
    filterPrint,
    filterCollection,
    filterAssignedUser,
    selectedProvince,
    isPaidFilter,
  ]);

  const fetchCollectSummary = useCallback(async () => {
    setLoading(true);

    try {
      const res = await collectSummaryAPI(filterAssignedUser);

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
  }, [filterAssignedUser]);

  const reloadInvoices = () => {
    if (isBulkSearchActive) {
      // If bulk search is active, re-run the bulk search to maintain the search state
      handleBulkSearch(bulkSearchCodes);
    } else {
      fetchInvoices(currentPage, invoicesPerPage);
      fetchCollectSummary();
    }
  };

  // --- Effects ---

  // 1. Fetch danh sách User
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchallUser();
        const filterUser = res.data.user.filter((user) => user.role === "user" && user.usertype === "internal");
        setUserData(filterUser);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // 2. Fetch danh sách Invoice khi filters, pagination, sort, search thay đổi (chỉ khi không bulk search)
  useEffect(() => {
    if (!isBulkSearchActive) {
      fetchInvoices(currentPage, invoicesPerPage);
      fetchCollectSummary();
    } else if (debouncedSearchValue) {
      // If bulk search is active but user starts typing a new search, reset bulk search
      setIsBulkSearchActive(false);
      setBulkSearchCodes([]);
    }
  }, [
    currentPage,
    invoicesPerPage,
    debouncedSearchValue,
    isBulkSearchActive,
    fetchCollectSummary,
    fetchInvoices,
  ]);

  // --- Handlers ---

  const createFilterChangeHandler = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    return (value: string) => {
      setter(value);
      setCurrentPage(1);
      // Reset bulk search when filters change
      setIsBulkSearchActive(false);
      setBulkSearchCodes([]);
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
    // Reset bulk search when search type changes
    setIsBulkSearchActive(false);
    setBulkSearchCodes([]);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // KHÔNG setCurrentPage(1) ở đây để input không bị giật,
    // việc gọi API và reset page sẽ do useEffect(debouncedSearchValue) đảm nhiệm
  };

  const handleBulkSearch = async (codes: string[]) => {
    // console.log("Danh sách mã cần tìm:", codes);
    const res = await fetchInvoiceBylist(codes);

    const foundInvoices = res.data.data;

    const mergedInvoices = codes.flatMap((code) => {
      // Tìm xem mã này có trong kết quả trả về không
      // Lưu ý: searchType quyết định so sánh theo invoiceNumber hay recordBookCode
      const matches = foundInvoices.filter((inv: InvoiceInfo) =>
        searchType === "stationCode" ? inv.recordBookCode === code : inv.invoiceNumber === code
      );

      if (matches.length > 0) {
        // Có dữ liệu -> Trả về danh sách hoá đơn tìm thấy
        return matches;
      } else {
        // Không có dữ liệu -> Tạo một hoá đơn "giả" để hiển thị lỗi
        return [
          {
            _id: `missing-${code}`,
            invoiceNumber: code,
            customerName: "Không có dữ liệu",
            totalAmount: 0,
            isMissing: true,
            recordBookCode: searchType === "stationCode" ? code : undefined,
          },
        ];
      }
    });

    setIsBulkSearchActive(true);
    setBulkSearchCodes(codes);
    setTotalPages(1);
    setInvoices(mergedInvoices);

    setAssignedCustomerCodes(res.data.summary.totalInvoices);
    setUnAssignedCustomerCodes(res.data.summary.unassignedInvoices);
    setTotalAmountInfo(res.data.summary.totalAmount);
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

  const handleEditSuccess = (updatedInvoice?: InvoiceInfo) => {
    setEditModalOpen(false);

    // Cập nhật ngay trên danh sách hiện tại theo _id để không bị "nhảy" sang dòng trùng mã khách hàng.
    if (updatedInvoice?._id) {
      setInvoices((prev) => prev.map((inv) => (inv._id === updatedInvoice._id ? { ...inv, ...updatedInvoice } : inv)));
      setSelectedInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      setEditingInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      return;
    }

    // Fallback nếu backend không trả object đầy đủ
    reloadInvoices();
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

  const handleToggleIsPaid = async (invoiceId: string) => {
    try {
      await handleToggleIsPaid_API(invoiceId);
      // Cập nhật state cục bộ để UI phản hồi nhanh hơn
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === invoiceId
            ? {
                ...inv,
                isPaid: !inv.isPaid, // 1. Đảo ngược trạng thái isPaid
              }
            : inv
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái!");
    }
  };

  // --- Hàm Export ---
  const handleExportConfirm = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui long dang nhap lai");
      return;
    }
    const params = new URLSearchParams();

    if (selectedUsers.length > 0) {
      params.append("userIds", selectedUsers.join(","));
    }
    if (collectionStatus !== "all") {
      params.append("collectionStatus", collectionStatus);
    }
    if (paymentStatus !== "all") {
      params.append("paymentStatus", paymentStatus);
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
      return;
    }

    // Đóng modal sau khi xuất
    setOpenExportModal(false);
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
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui long dang nhap lai");
      return;
    }
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/invoices/exportExcelByUser?assignedUserId=${selectedExportUser}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
    // 1. Validate
    if (!collectedFromDate || !collectedToDate) {
      toast.error("Vui lòng chọn khoảng thời gian (Từ ngày - Đến ngày)!");
      return;
    }

    // 2. Tạo Query Params
    const params = new URLSearchParams({
      fromDate: collectedFromDate,
      toDate: collectedToDate,
      status: collectedStatus, // 'collected' | 'not_collected' | 'all'
      isClosed: closingStatus, // 'true' | 'false' | 'all'
    });

    // Xử lý mảng userIds (nối chuỗi bằng dấu phẩy)
    if (selectedCollectedUsers.length > 0) {
      params.append("userIds", selectedCollectedUsers.join(","));
    }

    const apiUrl = `${getApiBaseUrl()}/api/invoices/exportExcelCollected?${params.toString()}`;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui long dang nhap lai");
      return;
    }

    // 3. Gọi API
    try {
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) {
        const errorData = await response.json();
        toast.error(errorData.message || "Có lỗi xảy ra khi xuất file.");
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

      // Reset và đóng modal
      setOpenExportCollected(false);
      // Có thể reset form
      setSelectedCollectedUsers([]);
      setCollectedStatus("paid");
    } catch (error) {
      console.error("Lỗi khi xuất file:", error);
      toast.error("Không thể kết nối tới máy chủ để xuất file.");
    }
  };

  return {
    // State
    invoices,
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

    // Hằng số
    billingPeriods,
    provinces,

    // Setters
    setFilterPrint,
    setFilterCollection,
    setFilterAssignedUser,
    setIsPaidFilter,
    isPaidFilter,
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

    // Handlers
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
  };
};

