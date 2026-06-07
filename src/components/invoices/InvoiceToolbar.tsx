import { ReactNode, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import ListIcon from "@mui/icons-material/List";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { useExpandableBillingPeriods } from "@/hooks/useExpandableBillingPeriods";
import { toDateKeyVN } from "@/lib/date-vn";
import { IUser } from "@/types/user";

type SearchType = "customerCode" | "stationCode";
type AreaOption = {
  value: string;
  label: string;
  prefix: string;
};

type CollectionFilterOption = {
  value: string;
  label: string;
  danger?: boolean;
};

const AREA_LABEL_SUFFIX_PATTERN = /\s*\([^)]*\)\s*$/;

interface InvoiceToolbarProps {
  invoicesCount?: number;
  onExport?: () => void;
  onExportPrinted?: () => void;
  exportButtonLabel?: string;
  invoicesPerPage?: number;
  onInvoicesPerPageChange?: (value: number) => void;
  onOpenAddDialog?: () => void;
  addButtonLabel?: string;
  selectedInvoicesCount?: number;
  onDeleteSelected?: () => void;
  deleteButtonLabel?: string;
  onOpenDeleteAllModal?: () => void;
  onOpenUploadWithProvince?: () => void;
  uploadButtonLabel?: string;
  onOpenUploadPaidInvoices?: () => void;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  onOpenExportByUser?: () => void;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  onBulkSearch?: (codes: string[]) => void;
  areaOptions?: AreaOption[];
  selectedAreaPrefixes?: string[];
  onSelectedAreaPrefixesChange?: (values: string[]) => void;
  filterPrint?: string;
  onFilterPrintChange?: (value: string) => void;
  filterCollection?: string;
  onFilterCollectionChange?: (value: string) => void;
  collectionFilterLabel?: string;
  collectionFilterOptions?: CollectionFilterOption[];
  filterCollectionDate?: string;
  onFilterCollectionDateChange?: (value: string) => void;
  filterAssignedUser?: string;
  onFilterAssignedUserChange?: (value: string) => void;
  selectedBillingPeriod?: string;
  onSelectedBillingPeriodChange?: (value: string) => void;
  userData?: IUser[];
  onBulkUpdate?: (updates: {
    recordBookCode?: string;
    assignedTo?: string | null;
    billing_period?: string;
    collectionStatus?: "collected" | "not_collected";
    collectionDate?: string | null;
  }) => void;
  billingPeriods?: string[];
  extraActions?: ReactNode;
}

const AREA_ALL_VALUE = "__all__";
const DEFAULT_BULK_UPDATE_FIELD = "collectionStatus";
const DEFAULT_BULK_UPDATE_VALUE = "collected";
const DEFAULT_BULK_COLLECTION_DATE = toDateKeyVN();
const DEFAULT_COLLECTION_FILTER_OPTIONS: CollectionFilterOption[] = [
  { value: "all", label: "Danh sách tổng" },
  { value: "collected_today", label: "Đã thu hôm nay" },
  { value: "collected", label: "Tất cả đã thu" },
  { value: "not_collected", label: "Chưa thu" },
  { value: "is_paid", label: "Đã đóng cước" },
  { value: "duplicates", label: "Giống mã KH", danger: true },
];

export default function InvoiceToolbar({
  invoicesCount = 0,
  onExport,
  onExportPrinted,
  exportButtonLabel = "Xuất Excel chọn lọc",
  invoicesPerPage = 30,
  onInvoicesPerPageChange,
  onOpenAddDialog,
  addButtonLabel = "Thêm HĐ mới",
  selectedInvoicesCount = 0,
  onDeleteSelected,
  deleteButtonLabel = "Xóa HĐ",
  onOpenDeleteAllModal,
  onOpenUploadWithProvince,
  uploadButtonLabel = "Tải Excel + người phụ trách",
  onOpenUploadPaidInvoices,
  searchValue = "",
  onSearchChange,
  searchType,
  onSearchTypeChange,
  onBulkSearch,
  areaOptions = [],
  selectedAreaPrefixes = [],
  onSelectedAreaPrefixesChange,
  filterPrint,
  onFilterPrintChange,
  filterCollection,
  onFilterCollectionChange,
  collectionFilterLabel = "Trạng thái hóa đơn",
  collectionFilterOptions = DEFAULT_COLLECTION_FILTER_OPTIONS,
  filterCollectionDate = "",
  onFilterCollectionDateChange,
  filterAssignedUser,
  onFilterAssignedUserChange,
  selectedBillingPeriod = "all",
  onSelectedBillingPeriodChange,
  userData = [],
  onBulkUpdate,
  billingPeriods = [],
  extraActions,
}: InvoiceToolbarProps) {
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState("");
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(null);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkUpdateField, setBulkUpdateField] = useState<
    "recordBookCode" | "assignedTo" | "billing_period" | "collectionStatus" | "collectionDate" | ""
  >(DEFAULT_BULK_UPDATE_FIELD);
  const [bulkUpdateValue, setBulkUpdateValue] = useState(DEFAULT_BULK_UPDATE_VALUE);

  const commonButtonSx = {
    borderRadius: 2,
    textTransform: "none",
  };

  const grayActionButtonSx = {
    ...commonButtonSx,
    backgroundColor: "#6b7280",
    color: "#fff",
    "&:hover": { backgroundColor: "#4b5563" },
  };

  const areaLabelByPrefix = useMemo(() => {
    const areaNameCounts = areaOptions.reduce<Record<string, number>>((accumulator, option) => {
      const baseLabel = option.label.replace(AREA_LABEL_SUFFIX_PATTERN, "").trim();
      accumulator[baseLabel] = (accumulator[baseLabel] || 0) + 1;
      return accumulator;
    }, {});

    return areaOptions.reduce<Record<string, string>>((accumulator, option) => {
      const baseLabel = option.label.replace(AREA_LABEL_SUFFIX_PATTERN, "").trim();
      accumulator[option.value] = areaNameCounts[baseLabel] > 1 ? option.label : baseLabel;
      return accumulator;
    }, {});
  }, [areaOptions]);

  const { visiblePeriods: visibleBillingPeriods, expandPeriods: expandBillingPeriods } = useExpandableBillingPeriods({
    fallbackPeriods: billingPeriods,
    selectedPeriod: selectedBillingPeriod !== "all" ? selectedBillingPeriod : undefined,
    resetKey: selectedBillingPeriod,
  });

  const searchLabel = searchType === "customerCode" ? "Mã KH" : "Mã trạm";
  const searchPlaceholder =
    searchType === "customerCode"
      ? "Nhập đủ mã hoặc vài ký tự/số cuối"
      : "Nhập đủ mã hoặc đoạn cuối mã trạm";

  const handleOpenBulkUpdate = () => {
    setBulkUpdateField(DEFAULT_BULK_UPDATE_FIELD);
    setBulkUpdateValue(DEFAULT_BULK_UPDATE_VALUE);
    setIsBulkUpdateOpen(true);
  };

  const handleApplyBulkUpdate = () => {
    if (!onBulkUpdate || !bulkUpdateField) return;

    const updates: Record<string, unknown> = {};
    if (bulkUpdateField === "recordBookCode") {
      if (!bulkUpdateValue.trim()) return;
      updates.recordBookCode = bulkUpdateValue.trim();
    } else if (bulkUpdateField === "billing_period") {
      if (!bulkUpdateValue) return;
      updates.billing_period = bulkUpdateValue;
    } else if (bulkUpdateField === "assignedTo") {
      updates.assignedTo = bulkUpdateValue || null;
    } else if (bulkUpdateField === "collectionStatus") {
      if (bulkUpdateValue !== "collected" && bulkUpdateValue !== "not_collected") return;
      updates.collectionStatus = bulkUpdateValue;
    } else if (bulkUpdateField === "collectionDate") {
      if (!bulkUpdateValue) return;
      updates.collectionDate = bulkUpdateValue;
    }

    onBulkUpdate(updates as Parameters<NonNullable<typeof onBulkUpdate>>[0]);
    setIsBulkUpdateOpen(false);
  };

  const handleSearchTypeSelect = (event: SelectChangeEvent) => {
    onSearchTypeChange(event.target.value as SearchType);
    onSearchChange?.("");
  };

  const handleAreaChange = (event: SelectChangeEvent<string[]>) => {
    if (!onSelectedAreaPrefixesChange) return;

    const rawValue = event.target.value;
    const nextValues = typeof rawValue === "string" ? rawValue.split(",") : rawValue;
    if (nextValues.includes(AREA_ALL_VALUE)) {
      onSelectedAreaPrefixesChange([]);
      return;
    }

    onSelectedAreaPrefixesChange(nextValues);
  };

  const handleProcessBulkSearch = () => {
    if (!onBulkSearch) return;

    const codes = bulkValue
      .split(/[\n, ]+/)
      .map((code) => code.trim())
      .filter(Boolean);

    onBulkSearch(codes);
    setIsBulkDialogOpen(false);
    setBulkValue("");
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {onExport && (
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={onExport}
              disabled={invoicesCount === 0}
              sx={{
                ...commonButtonSx,
                minWidth: { xs: "120px", sm: "160px" },
                backgroundColor: "#16a34a",
                color: "#fff",
                "&:hover": { backgroundColor: "#15803d" },
              }}
            >
              {exportButtonLabel}
            </Button>
          )}

          {onBulkSearch && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ListIcon />}
              onClick={() => setIsBulkDialogOpen(true)}
              sx={commonButtonSx}
            >
              Tìm hàng loạt
            </Button>
          )}

          {onOpenUploadWithProvince && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenUploadWithProvince}
              sx={{
                ...commonButtonSx,
                backgroundColor: "#facc15",
                color: "#fff",
                "&:hover": { backgroundColor: "#eab308" },
              }}
            >
              {uploadButtonLabel}
            </Button>
          )}

          {onOpenAddDialog && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenAddDialog}
              sx={{
                ...commonButtonSx,
                backgroundColor: "#facc15",
                color: "#fff",
                "&:hover": { backgroundColor: "#eab308" },
              }}
            >
              {addButtonLabel}
            </Button>
          )}

          {(onDeleteSelected || onOpenDeleteAllModal) && (
            <>
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowDropDownIcon />}
                onClick={(event) => setDeleteMenuAnchor(event.currentTarget)}
                sx={grayActionButtonSx}
              >
                {deleteButtonLabel}
              </Button>
              <Menu
                anchorEl={deleteMenuAnchor}
                open={Boolean(deleteMenuAnchor)}
                onClose={() => setDeleteMenuAnchor(null)}
              >
                {onDeleteSelected && (
                  <MenuItem
                    disabled={selectedInvoicesCount === 0}
                    onClick={() => {
                      setDeleteMenuAnchor(null);
                      onDeleteSelected();
                    }}
                  >
                    Xóa HĐ đang chọn ({selectedInvoicesCount})
                  </MenuItem>
                )}
                {onOpenDeleteAllModal && (
                  <MenuItem
                    onClick={() => {
                      setDeleteMenuAnchor(null);
                      onOpenDeleteAllModal();
                    }}
                  >
                    Xóa HĐ theo kỳ
                  </MenuItem>
                )}
              </Menu>
            </>
          )}

          {onOpenUploadPaidInvoices && (
            <Button variant="contained" size="small" onClick={onOpenUploadPaidInvoices} sx={grayActionButtonSx}>
              Cập nhật HĐ đã đóng cước
            </Button>
          )}

          {extraActions}

          {onBulkUpdate && (
            <Button
              variant="contained"
              size="small"
              disabled={selectedInvoicesCount === 0}
              onClick={handleOpenBulkUpdate}
              sx={{
                ...commonButtonSx,
                backgroundColor: "#2563eb",
                color: "#fff",
                "&:hover": { backgroundColor: "#1d4ed8" },
              }}
            >
              Cập nhật hàng loạt ({selectedInvoicesCount})
            </Button>
          )}

          {onExportPrinted && (
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={onExportPrinted}
              disabled={invoicesCount === 0}
              sx={{
                ...commonButtonSx,
                minWidth: { xs: "120px", sm: "160px" },
                backgroundColor: "#16a34a",
                color: "#fff",
                "&:hover": { backgroundColor: "#15803d" },
              }}
            >
              {exportButtonLabel}
            </Button>
          )}
        </Box>

        {onInvoicesPerPageChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 } }}>
            <InputLabel id="invoices-per-page-label">Hiển thị</InputLabel>
            <Select
              labelId="invoices-per-page-label"
              value={invoicesPerPage}
              label="Hiển thị"
              onChange={(event: SelectChangeEvent<number>) => onInvoicesPerPageChange(Number(event.target.value))}
            >
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
              <MenuItem value={500}>500</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {onSelectedAreaPrefixesChange && (
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 260 } }}>
            <InputLabel id="area-prefix-label">Xã/Phường</InputLabel>
            <Select
              multiple
              labelId="area-prefix-label"
              value={selectedAreaPrefixes}
              label="Xã/Phường"
              onChange={handleAreaChange}
              renderValue={(selected) => {
                const values = selected as string[];
                if (values.length === 0) return "Tất cả xã/phường";
                return values.map((value) => areaLabelByPrefix[value] || value).join(", ");
              }}
              MenuProps={{ PaperProps: { style: { maxHeight: 360, width: 320 } } }}
            >
              <MenuItem value={AREA_ALL_VALUE}>
                <Checkbox checked={selectedAreaPrefixes.length === 0} />
                <ListItemText primary="Tất cả xã/phường" />
              </MenuItem>
              {areaOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={selectedAreaPrefixes.includes(option.value)} />
                  <ListItemText primary={areaLabelByPrefix[option.value] || option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {onFilterAssignedUserChange && (
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 190 } }}>
            <InputLabel id="assigned-user-label">Người phụ trách</InputLabel>
            <Select
              labelId="assigned-user-label"
              value={filterAssignedUser ?? "all"}
              label="Người phụ trách"
              onChange={(event: SelectChangeEvent) => onFilterAssignedUserChange(event.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName || user.email}
                </MenuItem>
              ))}
              <MenuItem value="no_one">Chưa phụ trách</MenuItem>
            </Select>
          </FormControl>
        )}

        {onFilterPrintChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 170, sm: 190 } }}>
            <InputLabel id="filter-print-label">Trạng thái in bill</InputLabel>
            <Select
              labelId="filter-print-label"
              value={filterPrint ?? "all"}
              label="Trạng thái in bill"
              onChange={(event: SelectChangeEvent) => onFilterPrintChange(event.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="printed">Đã in</MenuItem>
              <MenuItem value="notPrinted">Chưa in</MenuItem>
            </Select>
          </FormControl>
        )}

        {onFilterCollectionChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 170, sm: 190 } }}>
            <InputLabel id="filter-collection-label">{collectionFilterLabel}</InputLabel>
            <Select
              labelId="filter-collection-label"
              value={filterCollection ?? "all"}
              label={collectionFilterLabel}
              onChange={(event: SelectChangeEvent) => onFilterCollectionChange(event.target.value)}
            >
              {collectionFilterOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={option.danger ? { color: "#ef4444", fontWeight: 600 } : undefined}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {onSelectedBillingPeriodChange && (
          <>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
              <InputLabel id="billing-period-filter-label">Kỳ thanh toán</InputLabel>
              <Select
                labelId="billing-period-filter-label"
                value={selectedBillingPeriod}
                label="Kỳ thanh toán"
                onChange={(event: SelectChangeEvent) => onSelectedBillingPeriodChange(event.target.value)}
              >
                <MenuItem value="all">Tất cả kỳ</MenuItem>
                {visibleBillingPeriods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={expandBillingPeriods} sx={{ minWidth: 44, px: 0 }}>
              +
            </Button>
          </>
        )}

        {onSearchChange && (
          <>
            <FormControl size="small" sx={{ minWidth: { xs: 110, sm: 130 } }}>
              <InputLabel id="search-type-label">Tìm theo</InputLabel>
              <Select labelId="search-type-label" value={searchType} label="Tìm theo" onChange={handleSearchTypeSelect}>
                <MenuItem value="customerCode">Mã KH</MenuItem>
                <MenuItem value="stationCode">Mã trạm</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={searchLabel}
              placeholder={searchPlaceholder}
              size="small"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              sx={{ width: { xs: "100%", sm: 220 } }}
            />
          </>
        )}

        {onFilterCollectionDateChange && filterCollection === "collected" && (
          <>
            <TextField
              size="small"
              label="Ngày thu"
              type="date"
              value={filterCollectionDate}
              onChange={(event) => onFilterCollectionDateChange(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Bỏ trống để xem tất cả đã thu"
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => onFilterCollectionDateChange(toDateKeyVN())}
              sx={{ ...commonButtonSx, height: "40px" }}
            >
              Hôm nay
            </Button>
            {filterCollectionDate && (
              <Button
                color="inherit"
                size="small"
                onClick={() => onFilterCollectionDateChange("")}
                sx={{ ...commonButtonSx, height: "40px" }}
              >
                Bỏ lọc ngày
              </Button>
            )}
          </>
        )}
      </Box>

      <Dialog open={isBulkDialogOpen} onClose={() => setIsBulkDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
          <SearchIcon color="primary" /> Tìm kiếm hàng loạt
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            rows={20}
            placeholder={`Ví dụ:\nPB07090005082\nPB07090024645\nPB05030075757\n...`}
            variant="outlined"
            value={bulkValue}
            onChange={(event) => setBulkValue(event.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsBulkDialogOpen(false)} color="inherit">
            Hủy bỏ
          </Button>
          <Button onClick={handleProcessBulkSearch} variant="contained" color="primary" disabled={!bulkValue.trim()}>
            Tìm ngay
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isBulkUpdateOpen} onClose={() => setIsBulkUpdateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold" }}>Cập nhật hàng loạt ({selectedInvoicesCount} hóa đơn)</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="bulk-update-field-label">Trường cần cập nhật</InputLabel>
            <Select
              labelId="bulk-update-field-label"
              label="Trường cần cập nhật"
              value={bulkUpdateField}
              onChange={(event) => {
                const nextField = event.target.value as typeof bulkUpdateField;
                setBulkUpdateField(nextField);
                setBulkUpdateValue(
                  nextField === DEFAULT_BULK_UPDATE_FIELD
                    ? DEFAULT_BULK_UPDATE_VALUE
                    : nextField === "collectionDate"
                    ? DEFAULT_BULK_COLLECTION_DATE
                    : ""
                );
              }}
            >
              <MenuItem value="recordBookCode">Mã trạm</MenuItem>
              <MenuItem value="assignedTo">Người phụ trách</MenuItem>
              <MenuItem value="billing_period">Kỳ thanh toán</MenuItem>
              <MenuItem value="collectionStatus">Trạng thái thu</MenuItem>
              <MenuItem value="collectionDate">Ngày thu</MenuItem>
            </Select>
          </FormControl>

          {bulkUpdateField === "recordBookCode" && (
            <TextField
              fullWidth
              size="small"
              label="Mã trạm mới"
              value={bulkUpdateValue}
              onChange={(event) => setBulkUpdateValue(event.target.value)}
            />
          )}

          {bulkUpdateField === "billing_period" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bulk-update-period-label">Kỳ thanh toán</InputLabel>
              <Select
                labelId="bulk-update-period-label"
                label="Kỳ thanh toán"
                value={bulkUpdateValue}
                onChange={(event) => setBulkUpdateValue(String(event.target.value))}
              >
                {visibleBillingPeriods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {bulkUpdateField === "assignedTo" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bulk-update-assignee-label">Người phụ trách</InputLabel>
              <Select
                labelId="bulk-update-assignee-label"
                label="Người phụ trách"
                value={bulkUpdateValue}
                onChange={(event) => setBulkUpdateValue(String(event.target.value))}
              >
                <MenuItem value="">(Bỏ trống / Chưa gán)</MenuItem>
                {userData.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {bulkUpdateField === "collectionStatus" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bulk-update-status-label">Trạng thái thu</InputLabel>
              <Select
                labelId="bulk-update-status-label"
                label="Trạng thái thu"
                value={bulkUpdateValue}
                onChange={(event) => setBulkUpdateValue(String(event.target.value))}
              >
                <MenuItem value="collected">Đã thu</MenuItem>
                <MenuItem value="not_collected">Chưa thu</MenuItem>
              </Select>
            </FormControl>
          )}

          {bulkUpdateField === "collectionDate" && (
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Ngày thu"
              value={bulkUpdateValue}
              onChange={(event) => setBulkUpdateValue(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Gán ngày thu hàng loạt và tự chuyển trạng thái sang Đã thu."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsBulkUpdateOpen(false)} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleApplyBulkUpdate}
            variant="contained"
            color="primary"
            disabled={
              !bulkUpdateField ||
              ((bulkUpdateField === "recordBookCode" ||
                bulkUpdateField === "billing_period" ||
                bulkUpdateField === "collectionStatus" ||
                bulkUpdateField === "collectionDate") &&
                !bulkUpdateValue)
            }
          >
            Áp dụng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
