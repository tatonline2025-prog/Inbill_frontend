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

// Import háº±ng sá»‘
import { PROVINCES, generateBillingPeriods } from "@/constants/invoice.constants";
import { CollectionSummaryProps } from "@/components/invoices/CollectionSummary";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { toDateKeyVN, toISOStringVN } from "@/lib/date-vn";

type SearchType = "customerCode" | "stationCode";
type SortDirection = "asc" | "desc" | "none";

// Custom hook Debounce (táº¡m thá»i Ä‘áº·t á»Ÿ Ä‘Ă¢y)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useInvoiceManagement = () => {
  // --- State Dá»¯ liá»‡u chĂ­nh ---
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [userData, setUserData] = useState<IUser[]>([]);
  const [collectSummary, setCollectSummary] = useState<CollectionSummaryProps>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State PhĂ¢n trang & TĂ³m táº¯t ---
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(0);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(0);
  const [totalAmountInfo, setTotalAmountInfo] = useState(0);

  // --- State Bá»™ lá»c ---
  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [isPaidFilter, setIsPaidFilter] = useState(false);

  // --- State TĂ¬m kiáº¿m & Sáº¯p xáº¿p ---
  const [searchType, setSearchType] = useState<SearchType>("customerCode");
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500); // 500ms debounce

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none");

  // --- State Bulk Search ---
  const [isBulkSearchActive, setIsBulkSearchActive] = useState(false);
  const [bulkSearchCodes, setBulkSearchCodes] = useState<string[]>([]);

  // --- State HĂ nh Ä‘á»™ng & Modal ---
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

  const today = toDateKeyVN();
  const [collectedFromDate, setCollectedFromDate] = useState<string>(today);
  const [collectedToDate, setCollectedToDate] = useState<string>(today);
  const [selectedCollectedUsers, setSelectedCollectedUsers] = useState<string[]>([]);
  const [collectedStatus, setCollectedStatus] = useState<string>("paid");
  const [closingStatus, setClosingStatus] = useState<string>("false");

  // --- Háº±ng sá»‘ ---
  const billingPeriods = useMemo(() => generateBillingPeriods(), []);
  const provinces = useMemo(() => PROVINCES, []);

  // --- Logic Fetch Dá»¯ liá»‡u ---

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
      console.error("Lá»—i khi táº£i hĂ³a Ä‘Æ¡n:", err);
      setError("KhĂ´ng thá»ƒ táº£i dá»¯ liá»‡u hĂ³a Ä‘Æ¡n. Vui lĂ²ng thá»­ láº¡i sau.");
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
        console.error("Lá»—i láº¥y dá»¯ liá»‡u:", res?.message);
      }
    } catch (error) {
      console.error("Lá»—i káº¿t ná»‘i API:", error);
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

  // 1. Fetch danh sĂ¡ch User
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

  // 2. Fetch danh sĂ¡ch Invoice khi filters, pagination, sort, search thay Ä‘á»•i (chá»‰ khi khĂ´ng bulk search)
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

  // TĂ¬m kiáº¿m
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
    // KHĂ”NG setCurrentPage(1) á»Ÿ Ä‘Ă¢y Ä‘á»ƒ input khĂ´ng bá»‹ giáº­t,
    // viá»‡c gá»i API vĂ  reset page sáº½ do useEffect(debouncedSearchValue) Ä‘áº£m nhiá»‡m
  };

  const handleBulkSearch = async (codes: string[]) => {
    // console.log("Danh sĂ¡ch mĂ£ cáº§n tĂ¬m:", codes);
    const normalizedCodes = codes.map((code) => code.trim().toUpperCase());
    const res = await fetchInvoiceBylist(normalizedCodes, searchType);

    const foundInvoices = res.data.data;

    const mergedInvoices = normalizedCodes.flatMap((code) => {
      // TĂ¬m xem mĂ£ nĂ y cĂ³ trong káº¿t quáº£ tráº£ vá» khĂ´ng
      // LÆ°u Ă½: searchType quyáº¿t Ä‘á»‹nh so sĂ¡nh theo invoiceNumber hay recordBookCode
      const matches = foundInvoices.filter((inv: InvoiceInfo) =>
        searchType === "stationCode"
          ? String(inv.recordBookCode || "").trim().toUpperCase() === code
          : String(inv.invoiceNumber || "").trim().toUpperCase() === code
      );

      if (matches.length > 0) {
        // CĂ³ dá»¯ liá»‡u -> Tráº£ vá» danh sĂ¡ch hoĂ¡ Ä‘Æ¡n tĂ¬m tháº¥y
        return matches;
      } else {
        // KhĂ´ng cĂ³ dá»¯ liá»‡u -> Táº¡o má»™t hoĂ¡ Ä‘Æ¡n "giáº£" Ä‘á»ƒ hiá»ƒn thá»‹ lá»—i
        return [
          {
            _id: `missing-${code}`,
            invoiceNumber: code,
            customerName: "KhĂ´ng cĂ³ dá»¯ liá»‡u",
            totalAmount: 0,
            isMissing: true,
            recordBookCode: searchType === "stationCode" ? code : undefined,
          },
        ];
      }
    });

    setIsBulkSearchActive(true);
    setBulkSearchCodes(normalizedCodes);
    setTotalPages(1);
    setInvoices(mergedInvoices);

    setAssignedCustomerCodes(res.data.summary.totalInvoices);
    setUnAssignedCustomerCodes(res.data.summary.unassignedInvoices);
    setTotalAmountInfo(res.data.summary.totalAmount);
  };

  // Sáº¯p xáº¿p
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

  // TĂ¡c vá»¥ dĂ²ng
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

    // Cáº­p nháº­t ngay trĂªn danh sĂ¡ch hiá»‡n táº¡i theo _id Ä‘á»ƒ khĂ´ng bá»‹ "nháº£y" sang dĂ²ng trĂ¹ng mĂ£ khĂ¡ch hĂ ng.
    if (updatedInvoice?._id) {
      setInvoices((prev) => prev.map((inv) => (inv._id === updatedInvoice._id ? { ...inv, ...updatedInvoice } : inv)));
      setSelectedInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      setEditingInvoice((prev) => (prev?._id === updatedInvoice._id ? { ...prev, ...updatedInvoice } : prev));
      return;
    }

    // Fallback náº¿u backend khĂ´ng tráº£ object Ä‘áº§y Ä‘á»§
    reloadInvoices();
  };

  // TĂ¡c vá»¥ XĂ³a
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

  // TĂ¡c vá»¥ Chá»n
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

  // TĂ¡c vá»¥ Toggle
  const handleToggle = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
    try {
      await handleToggle_API(invoiceId, field);
      // Cáº­p nháº­t state cá»¥c bá»™ Ä‘á»ƒ UI pháº£n há»“i nhanh hÆ¡n
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

  const handleToggleIsPaid = async (invoiceId: string) => {
    try {
      await handleToggleIsPaid_API(invoiceId);
      // Cáº­p nháº­t state cá»¥c bá»™ Ä‘á»ƒ UI pháº£n há»“i nhanh hÆ¡n
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === invoiceId
            ? {
                ...inv,
                isPaid: !inv.isPaid, // 1. Äáº£o ngÆ°á»£c tráº¡ng thĂ¡i isPaid
              }
            : inv
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Lá»—i khi cáº­p nháº­t tráº¡ng thĂ¡i!");
    }
  };

  // --- HĂ m Export ---
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
    if (filterPrint !== "all") {
      params.append("printStatus", filterPrint);
    }
    if (filterAssignedUser !== "all") {
      params.append("assignedUserId", filterAssignedUser);
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
    if (isPaidFilter) {
      params.append("isPaid", "true");
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
      return;
    }

    // ÄĂ³ng modal sau khi xuáº¥t
    setOpenExportModal(false);
  };

  const handleExportPrinted = () => {
    setOpenExportCollected(true);
  };

  const handleExportByUserConfirm = async () => {
    // (Giá»¯ nguyĂªn logic ExportByUserConfirm)
    if (!selectedExportUser) {
      alert("Vui lĂ²ng chá»n ngÆ°á»i phá»¥ trĂ¡ch!");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui long dang nhap lai");
      return;
    }
    try {
          const exportByUserParams = new URLSearchParams({ assignedUserId: selectedExportUser });
    if (sortField && sortDirection !== "none") {
      exportByUserParams.append("sortField", sortField);
      exportByUserParams.append("sortDirection", sortDirection === "asc" ? "1" : "-1");
    }
    const response = await fetch(
      `${getApiBaseUrl()}/api/invoices/exportExcelByUser?${exportByUserParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) {
        const errorData = await response.json();
        alert(errorData.message || "CĂ³ lá»—i xáº£y ra khi xuáº¥t file.");
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
      console.error("Lá»—i khi xuáº¥t file:", error);
      alert("KhĂ´ng thá»ƒ káº¿t ná»‘i tá»›i mĂ¡y chá»§ Ä‘á»ƒ xuáº¥t file.");
    }
  };

  const handleExportCollectedConfirm = async () => {
    // 1. Validate
    if (!collectedFromDate || !collectedToDate) {
      toast.error("Vui lĂ²ng chá»n khoáº£ng thá»i gian (Tá»« ngĂ y - Äáº¿n ngĂ y)!");
      return;
    }

    // 2. Táº¡o Query Params
    const params = new URLSearchParams({
      fromDate: collectedFromDate,
      toDate: collectedToDate,
      status: collectedStatus, // 'collected' | 'not_collected' | 'all'
      isClosed: closingStatus, // 'true' | 'false' | 'all'
    });

    if (sortField && sortDirection !== "none") {
      params.append("sortField", sortField);
      params.append("sortDirection", sortDirection === "asc" ? "1" : "-1");
    }

    // Xá»­ lĂ½ máº£ng userIds (ná»‘i chuá»—i báº±ng dáº¥u pháº©y)
    if (selectedCollectedUsers.length > 0) {
      params.append("userIds", selectedCollectedUsers.join(","));
    }

    const apiUrl = `${getApiBaseUrl()}/api/invoices/exportExcelCollected?${params.toString()}`;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui long dang nhap lai");
      return;
    }

    // 3. Gá»i API
    try {
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok || response.headers.get("content-type")?.includes("application/json")) {
        const errorData = await response.json();
        toast.error(errorData.message || "CĂ³ lá»—i xáº£y ra khi xuáº¥t file.");
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

      // Reset vĂ  Ä‘Ă³ng modal
      setOpenExportCollected(false);
      // CĂ³ thá»ƒ reset form
      setSelectedCollectedUsers([]);
      setCollectedStatus("paid");
    } catch (error) {
      console.error("Lá»—i khi xuáº¥t file:", error);
      toast.error("KhĂ´ng thá»ƒ káº¿t ná»‘i tá»›i mĂ¡y chá»§ Ä‘á»ƒ xuáº¥t file.");
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

    // Háº±ng sá»‘
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




