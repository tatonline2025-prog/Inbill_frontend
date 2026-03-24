// hooks/useUserInvoiceManagement.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { collectSummaryAPI, deleteInvoice_API, fetchuserinvoices, handleToggle_API } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { IUser } from "@/types/user"; // Giáº£ Ä‘á»‹nh IUser Ä‘Æ°á»£c import
import toast from "react-hot-toast";
import { SelectChangeEvent } from "@mui/material";
import { CollectionSummaryProps } from "@/components/invoices/CollectionSummary";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { toDateKeyVN, toISOStringVN } from "@/lib/date-vn";

type SearchType = "customerCode" | "stationCode";
type SortDirection = "asc" | "desc" | "none";

// Custom hook Debounce (TĂ¡ch riĂªng náº¿u cáº§n tĂ¡i sá»­ dá»¥ng á»Ÿ nhiá»u nÆ¡i)
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
  const [error, setError] = useState<string | null>(null); // --- State TĂ¬m kiáº¿m ---

  const [searchType, setSearchType] = useState<SearchType>("customerCode");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500); // --- Filter States ---

  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [isPaidFilter, setIsPaidFilter] = useState(false);
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
  const [openExportAllModal, setOpenExportAllModal] = useState(false);

  const today = toDateKeyVN();
  const [selectedCollectedDate, setSelectedCollectedDate] = useState(today);

  const [editingInvoice, setEditingInvoice] = useState<InvoiceInfo>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none");

  const [collectedFromDate, setCollectedFromDate] = useState(today); // Tá»« ngĂ y
  const [collectedToDate, setCollectedToDate] = useState(today); // Äáº¿n ngĂ y

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
        selectedProvince !== "all" ? selectedProvince : undefined,
        searchParams.customerCode,
        searchParams.stationCode,
        user?.province,
        sortFieldToSend,
        sortDirectionToSend,
        isPaidFilter
      );

      setTotalPages(res.data.pagination.totalPages);
      setAssignedCustomerCodes(res.data.summary.totalInvoices);
      setUnAssignedCustomerCodes(res.data.summary.unassignedInvoices || 0);
      setTotalAmountInfo(res.data.summary.totalAmount);
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Lá»—i khi táº£i hĂ³a Ä‘Æ¡n:", err);
      setError("KhĂ´ng thá»ƒ táº£i dá»¯ liá»‡u hĂ³a Ä‘Æ¡n. Vui lĂ²ng thá»­ láº¡i sau.");
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
    isPaidFilter,
  ]);

  const fetchCollectSummary = useCallback(async () => {
    setLoading(true);

    try {
      const res = await collectSummaryAPI(user?._id);

      if (res?.success) {
        setCollectSummary(res.data);
      } else {
        console.error("Lá»—i láº¥y dá»¯ liá»‡u:", res?.message);
      }
    } catch (error) {
      console.error("Lá»—i káº¿t ná»‘i API:", error);
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
    setSearchValue(value); // KHĂ”NG reset page á»Ÿ Ä‘Ă¢y, debounce sáº½ xá»­ lĂ½.
  };

  const handleSearchTypeChange = (e: SelectChangeEvent) => {
    setSearchType(e.target.value as SearchType);
    setSearchValue(""); // Reset giĂ¡ trá»‹ tĂ¬m kiáº¿m khi Ä‘á»•i loáº¡i
    setCurrentPage(1); // Reset page khi Ä‘á»•i loáº¡i
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
      toast.error("Vui lĂ²ng chá»n Ă­t nháº¥t má»™t hoĂ¡ Ä‘Æ¡n Ä‘á»ƒ xoĂ¡!");
      return;
    }

    const confirmDelete = window.confirm(`Báº¡n cĂ³ cháº¯c muá»‘n xoĂ¡ ${selectedInvoices.length} hoĂ¡ Ä‘Æ¡n Ä‘Ă£ chá»n khĂ´ng?`);
    if (!confirmDelete) return;

    try {
      await Promise.all(selectedInvoices.map((id) => deleteInvoice_API(id)));
      toast.success("ÄĂ£ xoĂ¡ thĂ nh cĂ´ng cĂ¡c hoĂ¡ Ä‘Æ¡n Ä‘Ă£ chá»n!");
      setSelectedInvoices([]);
      await reloadInvoices();
    } catch (error) {
      console.error(error);
      toast.error("Lá»—i khi xoĂ¡ hoĂ¡ Ä‘Æ¡n!");
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
                      : toISOStringVN()
                    : inv.collectionDate,
              }
            : inv
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Lá»—i khi cáº­p nháº­t tráº¡ng thĂ¡i!");
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

    const confirmDelete = window.confirm(`Báº¡n cĂ³ cháº¯c muá»‘n xoĂ¡ hoĂ¡ Ä‘Æ¡n ${selectedInvoice.invoiceNumber}?`);
    if (!confirmDelete) return;

    try {
      const res = await deleteInvoice_API(selectedInvoice._id);
      if (res!.status === 200 || res!.status === 204) {
        toast.success("XoĂ¡ hoĂ¡ Ä‘Æ¡n thĂ nh cĂ´ng!");
        reloadInvoices();
      } else {
        toast.error("KhĂ´ng thá»ƒ xoĂ¡ hoĂ¡ Ä‘Æ¡n, vui lĂ²ng thá»­ láº¡i.");
      }
    } catch (error) {
      console.error("Lá»—i khi xoĂ¡ hoĂ¡ Ä‘Æ¡n:", error);
      alert("ÄĂ£ xáº£y ra lá»—i khi xoĂ¡ hoĂ¡ Ä‘Æ¡n.");
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
    if (selectedProvince !== "all") {
      params.append("province", selectedProvince);
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
      toast.error("KhĂ´ng tĂ¬m tháº¥y thĂ´ng tin ngÆ°á»i dĂ¹ng.");
      return;
    }
    if (user.role !== "admin") {
      toast.error("Chuc nang nay chi danh cho admin.");
      return;
    }

    if (!collectedFromDate || !collectedToDate) {
      toast.error("Vui lĂ²ng chá»n khoáº£ng thá»i gian (Tá»« ngĂ y - Äáº¿n ngĂ y)!");
      return;
    }

    const params = new URLSearchParams({
      fromDate: collectedFromDate,
      toDate: collectedToDate,
      status: collectedStatus,
      isClosed: closingStatus,
      date: selectedCollectedDate,
      userIds: user._id, // Tá»± Ä‘á»™ng láº¥y user ID
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
        alert(errorData.message || "CĂ³ lá»—i xáº£y ra khi xuáº¥t file.");
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
      console.error("Lá»—i khi xuáº¥t file:", error);
      alert("KhĂ´ng thá»ƒ káº¿t ná»‘i tá»›i mĂ¡y chá»§ Ä‘á»ƒ xuáº¥t file.");
    }
  };

  const handleAddSuccess = () => {
    setOpenAddDialog(false);
    reloadInvoices();
    toast.success("ThĂªm hoĂ¡ Ä‘Æ¡n thĂ nh cĂ´ng!");
  };

  const handleEditSuccess = (updatedInvoice?: InvoiceInfo) => {
    setEditModalOpen(false);

    // Cáº­p nháº­t ngay trĂªn list hiá»‡n táº¡i Ä‘á»ƒ giá»¯ nguyĂªn page/vá»‹ trĂ­ Ä‘ang xem.
    if (updatedInvoice?._id) {
      setInvoices((prev) => prev.map((inv) => (inv._id === updatedInvoice._id ? { ...inv, ...updatedInvoice } : inv)));
      setSelectedInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      setEditingInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      return;
    }

    // Fallback náº¿u backend khĂ´ng tráº£ láº¡i object invoice Ä‘áº§y Ä‘á»§
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

  const searchLabel = searchType === "customerCode" ? "TĂ¬m theo MĂ£ khĂ¡ch hĂ ng" : "TĂ¬m theo MĂ£ tráº¡m";

  // --- RETURN OBJECT Cá»¦A HOOK ---
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
    setIsPaidFilter,
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







