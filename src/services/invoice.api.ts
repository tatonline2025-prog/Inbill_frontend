import { FetchInvoiceResponse, IInvoiceSummaryByUser, InvoiceInfo } from "@/types/invoice";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-base-url";

// Export Excel APIs - NEW (Phase 2)
export const exportExcelAPI = async (
  userIds?: string,
  collectionStatus?: string,
  paymentStatus?: string,
  sortField: string = "issueDate",
  sortDirection: string = "-1"
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.get(`${getApiBaseUrl()}/api/invoices/exportExcel`, {
    params: {
      userIds,
      collectionStatus,
      paymentStatus,
      sortField,
      sortDirection
    },
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob' // Important for Excel download
  });

  return res;
};

export const exportCollectedByDateAPI = async (
  date: string,
  sortField: string = "excelRowIndex", 
  sortDirection: string = "1"
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.get(`${getApiBaseUrl()}/api/invoices/exportExcelPrinted`, {
    params: { date, sortField, sortDirection },
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });

  return res;
};

export const exportByUserAPI = async (
  assignedUserId: string,
  sortField: string = "excelRowIndex",
  sortDirection: string = "1"  
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.get(`${getApiBaseUrl()}/api/invoices/exportExcelByUser`, {
    params: { assignedUserId, sortField, sortDirection },
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });

  return res;
};

export const exportExcelCollectedAPI = async (
  fromDate: string,
  toDate: string,
  isClosed: string,
  status: string,
  userIds?: string,
  sortField: string = "excelRowIndex",
  sortDirection: string = "1"
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.get(`${getApiBaseUrl()}/api/invoices/exportExcelCollected`, {
    params: { 
      fromDate, 
      toDate, 
      isClosed, 
      status, 
      userIds,
      sortField,
      sortDirection
    },
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  });

  return res;
};

// Original fetchallInvoice (unchanged)
export const fetchallInvoice = async (
  currentPage: number,
  invoicesPerPage: number,
  printStatus?: "printed" | "not_printed",
  collectionStatus?: "collected" | "not_collected",
  assignedUserId?: string,
  billingPeriod?: string,
  province?: string,
  customerCode?: string,
  stationCode?: string,
  userprovince?: string,
  sortField?: string | null,
  sortDirection?: "asc" | "desc",
  isPaid?: boolean,
  onlyDuplicates?: boolean,
  customerName?: string,
  collectionDate?: string,
  areaPrefix?: string
) => {
  const token = localStorage.getItem("token");

  const res = await axios.get<FetchInvoiceResponse>(`${getApiBaseUrl()}/api/invoices/fetchall`, {
    params: {
      currentPage,
      invoicesPerPage,
      printStatus,
      collectionStatus,
      assignedUserId,
      billingPeriod,
      province,
      customerCode,
      customerName,
      stationCode,
      userprovince,
      sortField,
      sortDirection,
      isPaid,
      onlyDuplicates: onlyDuplicates ? "true" : undefined,
      collectionDate,
      areaPrefix,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
};

export const fetchuserinvoices = async (
  currentPage: number,
  invoicesPerPage: number,
  printStatus?: "printed" | "not_printed",
  collectionStatus?: "collected" | "not_collected",
  province?: string,
  customerCode?: string,
  stationCode?: string,
  userprovince?: string,
  sortField?: string | null,
  sortDirection?: "asc" | "desc",
  isPaid?: boolean
) => {
  const token = localStorage.getItem("token");

  const res = await axios.get<FetchInvoiceResponse>(
    `${getApiBaseUrl()}/api/invoices/fetchuserinvoices`,
    {
      params: {
        currentPage,
        invoicesPerPage,
        printStatus,
        collectionStatus,
        province,
        customerCode,
        stationCode,
        userprovince,
        sortField,
        sortDirection,
        isPaid,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
};

export const fetchInvoiceBylist = async (
  codes?: string[],
  searchType?: "customerCode" | "stationCode"
) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${getApiBaseUrl()}/api/invoices/fetchbylist`,
    {
      codes,
      searchType,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
};

export const invoiceSummary = async (userId?: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chua dang nhap");

  const res = await axios.get<IInvoiceSummaryByUser[]>(`${getApiBaseUrl()}/api/invoices/summary`, {
    params: { userId },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
};

export interface IDailyCollectionSummary {
  date: string;
  totalCount: number;
  totalAmount: number;
  assignedUsers: string[];
}

export interface IDailyCollectionParams {
  days?: number;
  assignedUserId?: string;
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?: string;   // "YYYY-MM-DD"
}

export const dailyCollectionSummaryAPI = async (params: IDailyCollectionParams = {}) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chua dang nhap");

  const query: Record<string, string | number> = {};
  if (params.dateFrom && params.dateTo) {
    query.dateFrom = params.dateFrom;
    query.dateTo = params.dateTo;
  } else {
    query.days = params.days ?? 31;
  }
  if (params.assignedUserId && params.assignedUserId !== "all") {
    query.assignedUserId = params.assignedUserId;
  }

  const res = await axios.get<IDailyCollectionSummary[]>(
    `${getApiBaseUrl()}/api/invoices/daily-summary`,
    {
      params: query,
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res;
};

export const collectSummaryAPI = async (assignedUserId?: string) => {
  const token = localStorage.getItem("token");

  const res = await axios.get(`${getApiBaseUrl()}/api/invoices/collectsummary`, {
    params: { assignedUserId },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const fetchInvoiceByUser = async (token: string) => {
  const res = await axios.get<InvoiceInfo[]>(`${getApiBaseUrl()}/api/invoices/fetchallbyuser`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
};

export const fetchInvoiceByUserMonth = async (token: string) => {
  const res = await axios.get<InvoiceInfo[]>(
    `${getApiBaseUrl()}/api/invoices/fetchallbyusermonth`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res;
};

export const handleToggle_API = async (invoiceId: string, field: "printStatus" | "collectionStatus") => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const res = await axios.patch(
      `${getApiBaseUrl()}/api/invoices/${invoiceId}/toggle`,
      { field },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
    throw err;
  }
};

export const handleToggleIsPaid_API = async (invoiceId: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  try {
    const res = await axios.patch(
      `${getApiBaseUrl()}/api/invoices/${invoiceId}/toggleispaid`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
    throw err;
  }
};

export const bulkUpdateInvoices_API = async (
  ids: string[],
  updates: {
    recordBookCode?: string;
    assignedTo?: string | null;
    billing_period?: string;
    collectionStatus?: "collected" | "not_collected";
  }
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");
  const res = await axios.patch(
    `${getApiBaseUrl()}/api/invoices/bulk-update`,
    { ids, updates },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const updateCollectionDate_API = async (invoiceId: string, date: string | null) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");
  const res = await axios.patch(
    `${getApiBaseUrl()}/api/invoices/${invoiceId}/collection-date`,
    { date },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const syncDuplicateInvoices_API = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");
  const res = await axios.post(
    `${getApiBaseUrl()}/api/invoices/sync-duplicates`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const cleanupRedundantDuplicates_API = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");
  const res = await axios.post(
    `${getApiBaseUrl()}/api/invoices/cleanup-duplicates`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const handleToggleIsPaidList_API = async (data: { invoiceNumbers: string[] }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  try {
    const res = await axios.post(
      `${getApiBaseUrl()}/api/invoices/mark-paid-list`,
      { data },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
    throw err;
  }
};

export const createInvoice_API = async (newInvoice: {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  billing_period: string;
  currentAmount: string;
  previousAmount: string;
  totalAmount: string;
  recordBookCode: string;
  assignedTo: string;
}) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const res = await axios.post(
      `${getApiBaseUrl()}/api/invoices/creatnew`,
      { newInvoice },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Cập nhật trạng thái thất bại:", err);
    throw err;
  }
};

export const deleteInvoice_API = async (invoiceId: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");

    const res = await axios.delete(
      `${getApiBaseUrl()}/api/invoices/delete/${invoiceId}`,

      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
  } catch (err) {
    console.error("Xoá hoá đơn thất bại thất bại:", err);
  }
};

// Xoá tất cả hoá đơn theo kỳ
export const deleteInvoicesByBillingPeriod_API = async (billing_period: string) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.delete(`${getApiBaseUrl()}/api/invoices/deleteByBillingPeriod`, {
    params: { billing_period },
    headers: { Authorization: `Bearer ${token}` },
  });

  return res;
};

interface LatestPeriodResponse {
  billing_period: string;
}
export const deleteInvoicesByBillingPeriodAndUser_API = async (
  billing_period: string,
  assignedUserId?: string
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("ChÆ°a Ä‘Äƒng nháº­p");

  const res = await axios.delete(`${getApiBaseUrl()}/api/invoices/deleteByBillingPeriod`, {
    params: {
      billing_period,
      assignedUserId,
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  return res;
};

export const fetchLatestPeriod_API = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chua dang nhap");

  const res = await axios.get<LatestPeriodResponse>(
    `${getApiBaseUrl()}/api/invoices/latest-period`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

interface BillingPeriodsResponse {
  success: boolean;
  periods: string[];
}

export const fetchBillingPeriods_API = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chua dang nhap");

  const res = await axios.get<BillingPeriodsResponse>(`${getApiBaseUrl()}/api/invoices/billing-periods`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const fetchInvoicesForCopyAPI = async (
  filterPrint: string,
  filterCollection: string,
  filterAssignedUser: string,
  isPaidFilter?: boolean,
  selectedProvince?: string,
  areaPrefix?: string,
  billingPeriod?: string,
  searchType?: "customerCode" | "stationCode",
  searchValue?: string,
  collectionDate?: string
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chua dang nhap");

  const res = await axios.get(`${getApiBaseUrl()}/api/invoices/forcopy`, {
    params: {
      filterPrint,
      filterCollection,
      filterAssignedUser,
      isPaidFilter,
      selectedProvince,
      areaPrefix,
      billingPeriod,
      searchType,
      searchValue,
      collectionDate,
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  // console.log(res);

  return res.data;
};

export const updateInvoice = async (
  formData: Partial<Omit<InvoiceInfo, "assignedTo">> & { assignedTo?: string },
  invoiceId: string
) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await axios.put(
    `${getApiBaseUrl()}/api/invoices/update/${invoiceId}`,
    {
      formData,
    },
    {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

