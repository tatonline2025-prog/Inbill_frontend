// hooks/useInvoiceManagement.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collectSummaryAPI,
  deleteInvoice_API,
  bulkUpdateInvoices_API,
  fetchBillingPeriods_API,
  fetchallInvoice,
  fetchInvoiceBylist,
  handleToggle_API,
  handleToggleIsPaid_API,
} from "@/services/invoice.api";
import { InvoiceInfo, InvoiceNumberDuplicateStatus } from "@/types/invoice";
import { fetchallUser } from "@/services/user.api";
import { IUser } from "@/types/user";
import toast from "react-hot-toast";

import { generateBillingPeriods } from "@/constants/invoice.constants";
import { CollectionSummaryProps } from "@/components/invoices/CollectionSummary";
import { getApiBaseUrl } from "@/lib/api-base-url";
import {
  compareAreaPrefixEntries,
  formatAreaPrefixLabel,
  userMatchesAreaPrefixes,
} from "@/lib/area-prefix";
import { toDateKeyVN, toISOStringVN } from "@/lib/date-vn";
import { useAreaPrefixMap } from "@/hooks/useAreaPrefixMap";

type SearchType = "customerCode" | "stationCode";
type SortDirection = "asc" | "desc" | "none";
type AreaFilterOption = {
  value: string;
  label: string;
  prefix: string;
};

// Custom hook Debounce (tạm thời đặt ở đây)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const sortBillingPeriodsDesc = (values: string[]) => {
  return [...values].sort((left, right) => {
    const leftMatch = /^(\d{2})\/(\d{4})$/.exec(left);
    const rightMatch = /^(\d{2})\/(\d{4})$/.exec(right);

    if (!leftMatch && !rightMatch) return right.localeCompare(left, "vi");
    if (!leftMatch) return 1;
    if (!rightMatch) return -1;

    const leftYear = Number(leftMatch[2]);
    const rightYear = Number(rightMatch[2]);
    if (leftYear !== rightYear) return rightYear - leftYear;

    return Number(rightMatch[1]) - Number(leftMatch[1]);
  });
};

export const useInvoiceManagement = () => {
  // --- State Dữ liệu chính ---
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [duplicateInvoiceNumbers, setDuplicateInvoiceNumbers] = useState<string[]>([]);
  const [invoiceNumberStatuses, setInvoiceNumberStatuses] = useState<Record<string, InvoiceNumberDuplicateStatus>>({});
  const [userData, setUserData] = useState<IUser[]>([]);
  const [collectSummary, setCollectSummary] = useState<CollectionSummaryProps>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State Phân trang & Tóm tắt ---
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [assignedCustomerCodes, setAssignedCustomerCodes] = useState(0);
  const [unassignedCustomerCodes, setUnAssignedCustomerCodes] = useState(0);
  const [totalAmountInfo, setTotalAmountInfo] = useState(0);

  // --- State Bộ lọc ---
  const [filterPrint, setFilterPrint] = useState("all");
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterCollectionDate, setFilterCollectionDate] = useState("");
  const [filterAssignedUser, setFilterAssignedUser] = useState("all");
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("all");
  const [selectedAreaPrefixes, setSelectedAreaPrefixes] = useState<string[]>([]);
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

  const today = toDateKeyVN();
  const [collectedFromDate, setCollectedFromDate] = useState<string>(today);
  const [collectedToDate, setCollectedToDate] = useState<string>(today);
  const [selectedCollectedUsers, setSelectedCollectedUsers] = useState<string[]>([]);
  const [collectedStatus, setCollectedStatus] = useState<string>("paid");
  const [closingStatus, setClosingStatus] = useState<string>("all");

  // --- Hằng số ---
  const defaultBillingPeriods = useMemo(() => generateBillingPeriods(), []);
  const [billingPeriods, setBillingPeriods] = useState<string[]>(defaultBillingPeriods);
  const { configs: areaConfigs } = useAreaPrefixMap();
  const areaOptions = useMemo<AreaFilterOption[]>(() => {
    const sortedConfigs = [...areaConfigs]
      .filter((config) => config.prefix)
      .sort((a, b) => compareAreaPrefixEntries(a, b));

    return sortedConfigs.map((config) => ({
      value: config.prefix,
      label: formatAreaPrefixLabel(config),
      prefix: config.prefix,
    }));
  }, [areaConfigs]);
  const filteredAssignedUsers = useMemo(() => {
    return userData.filter((user) => userMatchesAreaPrefixes(user, selectedAreaPrefixes));
  }, [selectedAreaPrefixes, userData]);

  // --- Logic Fetch Dữ liệu ---

  const fetchInvoices = useCallback(async (page = currentPage, perPage = invoicesPerPage) => {
    try {
      setLoading(true);
      setError(null);

      const sortFieldToSend = sortDirection !== "none" ? sortField : undefined;
      const sortDirectionToSend = sortDirection !== "none" ? sortDirection : undefined;

      const searchParams: { customerCode?: string; stationCode?: string } = {};
      const normalizedSearchValue = debouncedSearchValue.trim();
      const collectionStatusParam =
        filterCollection === "not_collected"
          ? "not_collected"
          : filterCollection === "collected" || filterCollection === "collected_today"
          ? "collected"
          : undefined;
      const collectionDateParam =
        filterCollection === "collected_today"
          ? today
          : filterCollection === "collected" && filterCollectionDate
          ? filterCollectionDate
          : undefined;

      if (normalizedSearchValue) {
        if (searchType === "customerCode") {
          searchParams.customerCode = normalizedSearchValue;
        } else if (searchType === "stationCode") {
          searchParams.stationCode = normalizedSearchValue;
        }
      }

      const res = await fetchallInvoice(
        page,
        perPage,
        filterPrint !== "all" ? (filterPrint === "notPrinted" ? "not_printed" : "printed") : undefined,
        collectionStatusParam,
        filterAssignedUser !== "all" ? filterAssignedUser : undefined,
        selectedBillingPeriod !== "all" ? selectedBillingPeriod : undefined,
        undefined,
        searchParams.customerCode,
        searchParams.stationCode,
        undefined,
        sortFieldToSend,
        sortDirectionToSend,
        isPaidFilter,
        filterCollection === "duplicates",
        undefined,
        collectionDateParam,
        selectedAreaPrefixes.length > 0 ? selectedAreaPrefixes.join(",") : undefined
      );

      setTotalPages(res.data.pagination.totalPages);
      setAssignedCustomerCodes(res.data.summary.assignedCustomerCodes ?? res.data.summary.totalInvoices);
      setUnAssignedCustomerCodes(res.data.summary.unassignedCustomerCodes ?? res.data.summary.unassignedInvoices);
      setTotalAmountInfo(res.data.summary.totalAmount);
      setInvoices(res.data.data);
      setDuplicateInvoiceNumbers(res.data.duplicateInvoiceNumbers || []);
      setInvoiceNumberStatuses(res.data.invoiceNumberStatuses || {});
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
    selectedBillingPeriod,
    selectedAreaPrefixes,
    isPaidFilter,
    filterCollectionDate,
    today,
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

  // 1. Fetch danh sĂ¡ch User
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, billingPeriodResponse] = await Promise.all([
          fetchallUser(),
          fetchBillingPeriods_API().catch(() => ({ success: false, periods: [] })),
        ]);

        const filterUser = userResponse.data.user.filter((user) => user.role === "user" && user.usertype === "internal");
        setUserData(filterUser);

        const mergedBillingPeriods = sortBillingPeriodsDesc(
          Array.from(new Set([...defaultBillingPeriods, ...(billingPeriodResponse.periods || [])]))
        );
        setBillingPeriods(mergedBillingPeriods);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [defaultBillingPeriods]);

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

  useEffect(() => {
    if (
      filterAssignedUser !== "all" &&
      filterAssignedUser !== "no_one" &&
      !filteredAssignedUsers.some((user) => user._id === filterAssignedUser)
    ) {
      setFilterAssignedUser("all");
    }
  }, [filterAssignedUser, filteredAssignedUsers]);

  // --- Handlers ---

  const createFilterChangeHandler = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    return (value: string) => {
      setter(value);
      setSearchValue("");
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
    setCurrentPage(1);
    if (isBulkSearchActive) {
      setIsBulkSearchActive(false);
      setBulkSearchCodes([]);
    }
  };

  const handleAreaFilterChange = (values: string[]) => {
    setSelectedAreaPrefixes(values);
    setSearchValue("");
    setCurrentPage(1);
    setIsBulkSearchActive(false);
    setBulkSearchCodes([]);
  };

  const handleCollectionFilterChange = (value: string) => {
    if (value === "is_paid") {
      setIsPaidFilter(true);
      setFilterCollection("all");
      setFilterCollectionDate("");
    } else {
      setIsPaidFilter(false);
      setFilterCollection(value);
      if (value !== "collected") {
        setFilterCollectionDate("");
      }
    }
    setSearchValue("");
    setCurrentPage(1);
    setIsBulkSearchActive(false);
    setBulkSearchCodes([]);
  };

  const handleCollectionDateFilterChange = (value: string) => {
    setFilterCollectionDate(value);
    setSearchValue("");
    setCurrentPage(1);
    setIsBulkSearchActive(false);
    setBulkSearchCodes([]);
  };

  const handleBulkSearch = async (codes: string[]) => {
    // console.log("Danh sách mã cần tìm:", codes);
    const normalizedCodes = codes.map((code) => code.trim().toUpperCase());
    const res = await fetchInvoiceBylist(normalizedCodes, searchType);

    const foundInvoices = res.data.data;

    const mergedInvoices = normalizedCodes.flatMap((code) => {
      // Tìm xem mã này có trong kết quả trả về không
      // Lưu ý: searchType quyết định so sánh theo invoiceNumber hay recordBookCode
      const matches = foundInvoices.filter((inv: InvoiceInfo) =>
        searchType === "stationCode"
          ? String(inv.recordBookCode || "").trim().toUpperCase() === code
          : String(inv.invoiceNumber || "").trim().toUpperCase() === code
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
    setBulkSearchCodes(normalizedCodes);
    setSearchValue("");
    setTotalPages(1);
    setInvoices(mergedInvoices);
    setInvoiceNumberStatuses({});

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
  const handleDeleteSelected = async () => {    if (selectedInvoices.length === 0) {
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

  // Tác vụ cập nhật hàng loạt cho các hóa đơn được chọn
  const handleBulkUpdate = async (updates: {
    recordBookCode?: string;
    assignedTo?: string | null;
    billing_period?: string;
    collectionStatus?: "collected" | "not_collected";
    collectionDate?: string | null;
  }) => {
    if (selectedInvoices.length === 0) {
      toast.error("Vui lòng chọn ít nhất một hoá đơn!");
      return;
    }
    if (!updates || Object.keys(updates).length === 0) {
      toast.error("Chưa chọn trường cần cập nhật.");
      return;
    }
    try {
      const res = await bulkUpdateInvoices_API(selectedInvoices, updates);
      toast.success(`Đã cập nhật ${res.data?.modifiedCount ?? selectedInvoices.length} hoá đơn.`);
      setSelectedInvoices([]);
      await reloadInvoices();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật hàng loạt.");
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

      // Nếu bật "Đã thu" thì tự động tắt "Đã đóng cước".
      // Nếu tắt "Đã thu" thì chuyển về "Chưa thu".
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

  const handleToggleIsPaid = async (invoiceId: string) => {
    const targetInvoice = invoices.find((inv) => inv._id === invoiceId);
    if (!targetInvoice) return;

    try {
      // Bật "Đã đóng cước" => tự tắt "Đã thu".
      // Tắt "Đã đóng cước" => về "Chưa thu".
      const nextIsPaid = !(targetInvoice.isPaid ?? false);
      const nextCollectionStatus = "not_collected";

      if ((targetInvoice.isPaid ?? false) !== nextIsPaid) {
        await handleToggleIsPaid_API(invoiceId);
      }
      if (targetInvoice.collectionStatus !== nextCollectionStatus) {
        await handleToggle_API(invoiceId, "collectionStatus");
      }

      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === invoiceId
            ? {
                ...inv,
                isPaid: nextIsPaid,
                collectionStatus: nextCollectionStatus,
                collectionDate: null,
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

  // --- Hàm Export ---
  const handleExportConfirm = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập lại");
      return;
    }
    const params = new URLSearchParams();
    const normalizedSearchValue = searchValue.trim();
    const exportCollectionStatus =
      filterCollection === "collected_today"
        ? "collected"
        : filterCollection === "collected" || filterCollection === "not_collected"
        ? filterCollection
        : collectionStatus !== "all"
        ? collectionStatus
        : undefined;

    if (selectedUsers.length > 0) {
      params.append("userIds", selectedUsers.join(","));
    }
    if (exportCollectionStatus) {
      params.append("collectionStatus", exportCollectionStatus);
    }
    if (paymentStatus !== "all") {
      params.append("paymentStatus", paymentStatus);
    }
    if (filterPrint !== "all") {
      params.append("printStatus", filterPrint === "notPrinted" ? "not_printed" : "printed");
    }
    if (filterAssignedUser !== "all") {
      params.append("assignedUserId", filterAssignedUser);
    }
    if (selectedBillingPeriod !== "all") {
      params.append("billingPeriod", selectedBillingPeriod);
    }
    if (selectedAreaPrefixes.length > 0) {
      params.append("areaPrefix", selectedAreaPrefixes.join(","));
    }
    if (normalizedSearchValue) {
      if (searchType === "customerCode") {
        params.append("customerCode", normalizedSearchValue);
      } else if (searchType === "stationCode") {
        params.append("stationCode", normalizedSearchValue);
      }
    }
    if (filterCollection === "collected_today") {
      params.append("collectionDate", today);
    } else if (filterCollection === "collected" && filterCollectionDate) {
      params.append("collectionDate", filterCollectionDate);
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
        toast.error(errorData.message || "Có lỗi xảy ra khi xuất file.");
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
      console.error("Lỗi khi xuất file:", error);
      toast.error("Không thể kết nối tới máy chủ để xuất file.");
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
      toast.error("Vui lòng đăng nhập lại");
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

    if (sortField && sortDirection !== "none") {
      params.append("sortField", sortField);
      params.append("sortDirection", sortDirection === "asc" ? "1" : "-1");
    }

    // Xử lý mảng userIds (nối chuỗi bằng dấu phẩy)
    if (selectedCollectedUsers.length > 0) {
      params.append("userIds", selectedCollectedUsers.join(","));
    }

    const apiUrl = `${getApiBaseUrl()}/api/invoices/exportExcelCollected?${params.toString()}`;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập lại");
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
    filterCollectionDate,
    filterAssignedUser,
    selectedBillingPeriod,
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

    // Hằng số
    billingPeriods,
    areaOptions,

    // Setters
    setFilterPrint,
    setFilterCollection,
    setFilterCollectionDate,
    setFilterAssignedUser,
    setSelectedBillingPeriod,
    setIsPaidFilter,
    isPaidFilter,
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
    handleAreaFilterChange,
    handleCollectionFilterChange,
    handleCollectionDateFilterChange,
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
  };
};



