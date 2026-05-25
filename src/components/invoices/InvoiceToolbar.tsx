import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
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

import { IUser } from "@/types/user";

type SearchType = "customerCode" | "stationCode";
type AreaOption = {
  value: string;
  label: string;
};

interface InvoiceToolbarProps {
  invoicesCount?: number;
  onExport?: () => void;
  onExportPrinted?: () => void;
  invoicesPerPage?: number;
  onInvoicesPerPageChange?: (value: number) => void;
  onOpenAddDialog?: () => void;
  selectedInvoicesCount?: number;
  onDeleteSelected?: () => void;
  onOpenDeleteAllModal?: () => void;
  onOpenUploadWithProvince?: () => void;
  onOpenUploadPaidInvoices?: () => void;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  onOpenExportByUser?: () => void;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  onBulkSearch?: (codes: string[]) => void;
  areaOptions?: AreaOption[];
  selectedAreaPrefix?: string;
  onSelectedAreaPrefixChange?: (value: string) => void;
  filterPrint?: string;
  onFilterPrintChange?: (value: string) => void;
  filterCollection?: string;
  onFilterCollectionChange?: (value: string) => void;
  filterAssignedUser?: string;
  onFilterAssignedUserChange?: (value: string) => void;
  userData?: IUser[];
  onBulkUpdate?: (updates: {
    recordBookCode?: string;
    assignedTo?: string | null;
    billing_period?: string;
    collectionStatus?: "collected" | "not_collected";
  }) => void;
  billingPeriods?: string[];
}

export default function InvoiceToolbar({
  invoicesCount = 0,
  onExport,
  onExportPrinted,
  invoicesPerPage = 30,
  onInvoicesPerPageChange,
  onOpenAddDialog,
  selectedInvoicesCount = 0,
  onDeleteSelected,
  onOpenDeleteAllModal,
  onOpenUploadWithProvince,
  onOpenUploadPaidInvoices,
  searchValue = "",
  onSearchChange,
  searchType,
  onSearchTypeChange,
  onBulkSearch,
  areaOptions = [],
  selectedAreaPrefix = "all",
  onSelectedAreaPrefixChange,
  filterPrint,
  onFilterPrintChange,
  filterCollection,
  onFilterCollectionChange,
  filterAssignedUser,
  onFilterAssignedUserChange,
  userData = [],
  onBulkUpdate,
  billingPeriods = [],
}: InvoiceToolbarProps) {
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState("");
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(null);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [buField, setBuField] = useState<"recordBookCode" | "assignedTo" | "billing_period" | "collectionStatus" | "">("");
  const [buValue, setBuValue] = useState("");

  const commonButtonSx = {
    borderRadius: 2,
    textTransform: "none",
  };

  const searchLabel = searchType === "customerCode" ? "Tim theo Ma KH" : "Tim theo Ma tram";
  const searchPlaceholder =
    searchType === "customerCode"
      ? "Nhap du ma hoac vai ky tu/so cuoi"
      : "Nhap du ma hoac doan cuoi ma tram";

  const handleOpenBulkUpdate = () => {
    setBuField("");
    setBuValue("");
    setIsBulkUpdateOpen(true);
  };

  const handleApplyBulkUpdate = () => {
    if (!onBulkUpdate || !buField) return;

    const updates: Record<string, unknown> = {};
    if (buField === "recordBookCode") {
      if (!buValue.trim()) return;
      updates.recordBookCode = buValue.trim();
    } else if (buField === "billing_period") {
      if (!buValue) return;
      updates.billing_period = buValue;
    } else if (buField === "assignedTo") {
      updates.assignedTo = buValue || null;
    } else if (buField === "collectionStatus") {
      if (buValue !== "collected" && buValue !== "not_collected") return;
      updates.collectionStatus = buValue;
    }

    onBulkUpdate(updates as Parameters<NonNullable<typeof onBulkUpdate>>[0]);
    setIsBulkUpdateOpen(false);
  };

  const handleSearchTypeSelect = (event: SelectChangeEvent) => {
    onSearchTypeChange(event.target.value as SearchType);
    onSearchChange?.("");
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
              Xuat Excel chon loc
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
              Upload Excel + NPT
            </Button>
          )}

          {onOpenUploadPaidInvoices && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenUploadPaidInvoices}
              sx={{
                ...commonButtonSx,
                backgroundColor: "#facc15",
                color: "#fff",
                "&:hover": { backgroundColor: "#eab308" },
              }}
            >
              Cap nhat HD da dong cuoc
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
              Them HD moi
            </Button>
          )}

          {(onDeleteSelected || onOpenDeleteAllModal) && (
            <>
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowDropDownIcon />}
                onClick={(event) => setDeleteMenuAnchor(event.currentTarget)}
                sx={{
                  ...commonButtonSx,
                  backgroundColor: "#6b7280",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#4b5563" },
                }}
              >
                Xoa HD
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
                    Xoa HD dang chon ({selectedInvoicesCount})
                  </MenuItem>
                )}
                {onOpenDeleteAllModal && (
                  <MenuItem
                    onClick={() => {
                      setDeleteMenuAnchor(null);
                      onOpenDeleteAllModal();
                    }}
                  >
                    Xoa HD theo ky
                  </MenuItem>
                )}
              </Menu>
            </>
          )}

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
              Cap nhat hang loat ({selectedInvoicesCount})
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
              Xuat Excel chon loc
            </Button>
          )}
        </Box>

        {onInvoicesPerPageChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 } }}>
            <InputLabel id="invoices-per-page-label">Hien thi</InputLabel>
            <Select
              labelId="invoices-per-page-label"
              value={invoicesPerPage}
              label="Hien thi"
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
        {onSelectedAreaPrefixChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 180, sm: 220 } }}>
            <InputLabel id="area-prefix-label">Xa/Phuong</InputLabel>
            <Select
              labelId="area-prefix-label"
              value={selectedAreaPrefix}
              label="Xa/Phuong"
              onChange={(event: SelectChangeEvent) => onSelectedAreaPrefixChange(event.target.value)}
            >
              <MenuItem value="all">Tat ca xa/phuong</MenuItem>
              {areaOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {onSearchChange && (
          <>
            <FormControl size="small" sx={{ minWidth: { xs: 110, sm: 130 } }}>
              <InputLabel id="search-type-label">Tim theo</InputLabel>
              <Select
                labelId="search-type-label"
                value={searchType}
                label="Tim theo"
                onChange={handleSearchTypeSelect}
              >
                <MenuItem value="customerCode">Ma KH</MenuItem>
                <MenuItem value="stationCode">Ma tram</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={searchLabel}
              placeholder={searchPlaceholder}
              size="small"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              sx={{ width: { xs: "100%", sm: 320, md: 420 } }}
            />
          </>
        )}

        {onBulkSearch && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ListIcon />}
            onClick={() => setIsBulkDialogOpen(true)}
            sx={{ ...commonButtonSx, height: "40px" }}
          >
            Tim hang loat
          </Button>
        )}

        {onFilterPrintChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160 } }}>
            <InputLabel id="filter-print-label">Trang thai in bill</InputLabel>
            <Select
              labelId="filter-print-label"
              value={filterPrint ?? "all"}
              label="Trang thai in bill"
              onChange={(event: SelectChangeEvent) => onFilterPrintChange(event.target.value)}
            >
              <MenuItem value="all">Tat ca</MenuItem>
              <MenuItem value="printed">Da in</MenuItem>
              <MenuItem value="notPrinted">Chua in</MenuItem>
            </Select>
          </FormControl>
        )}

        {onFilterCollectionChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 160, sm: 180 } }}>
            <InputLabel id="filter-collection-label">Trang thai hoa don</InputLabel>
            <Select
              labelId="filter-collection-label"
              value={filterCollection ?? "collected_today"}
              label="Trang thai hoa don"
              onChange={(event: SelectChangeEvent) => onFilterCollectionChange(event.target.value)}
            >
              <MenuItem value="collected_today">Da thu hom nay</MenuItem>
              <MenuItem value="collected">Tat ca da thu</MenuItem>
              <MenuItem value="all">Danh sach day du</MenuItem>
              <MenuItem value="not_collected">Chua thu</MenuItem>
              <MenuItem value="is_paid">Da dong cuoc</MenuItem>
              <MenuItem value="duplicates" sx={{ color: "#ef4444", fontWeight: 600 }}>
                Ma trung
              </MenuItem>
            </Select>
          </FormControl>
        )}

        {onFilterAssignedUserChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160 } }}>
            <InputLabel id="assigned-user-label">Nguoi phu trach</InputLabel>
            <Select
              labelId="assigned-user-label"
              value={filterAssignedUser ?? "all"}
              label="Nguoi phu trach"
              onChange={(event: SelectChangeEvent) => onFilterAssignedUserChange(event.target.value)}
            >
              <MenuItem value="all">Tat ca</MenuItem>
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName || user.email}
                </MenuItem>
              ))}
              <MenuItem value="no_one">Chua phu trach</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      <Dialog open={isBulkDialogOpen} onClose={() => setIsBulkDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
          <SearchIcon color="primary" /> Tim kiem hang loat ma
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            rows={20}
            placeholder={`Vi du:\nPB07090005082\nPB07090024645\nPB05030075757\n...`}
            variant="outlined"
            value={bulkValue}
            onChange={(event) => setBulkValue(event.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsBulkDialogOpen(false)} color="inherit">
            Huy bo
          </Button>
          <Button onClick={handleProcessBulkSearch} variant="contained" color="primary" disabled={!bulkValue.trim()}>
            Tim kiem ngay
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isBulkUpdateOpen} onClose={() => setIsBulkUpdateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold" }}>Cap nhat hang loat ({selectedInvoicesCount} hoa don)</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="bu-field-label">Truong can cap nhat</InputLabel>
            <Select
              labelId="bu-field-label"
              label="Truong can cap nhat"
              value={buField}
              onChange={(event) => {
                setBuField(event.target.value as typeof buField);
                setBuValue("");
              }}
            >
              <MenuItem value="recordBookCode">Ma tram</MenuItem>
              <MenuItem value="assignedTo">Nguoi phu trach</MenuItem>
              <MenuItem value="billing_period">Ky TT</MenuItem>
              <MenuItem value="collectionStatus">Trang thai thu</MenuItem>
            </Select>
          </FormControl>

          {buField === "recordBookCode" && (
            <TextField
              fullWidth
              size="small"
              label="Ma tram moi"
              value={buValue}
              onChange={(event) => setBuValue(event.target.value)}
            />
          )}

          {buField === "billing_period" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bu-bp-label">Ky TT</InputLabel>
              <Select
                labelId="bu-bp-label"
                label="Ky TT"
                value={buValue}
                onChange={(event) => setBuValue(String(event.target.value))}
              >
                {billingPeriods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {buField === "assignedTo" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bu-au-label">Nguoi phu trach</InputLabel>
              <Select
                labelId="bu-au-label"
                label="Nguoi phu trach"
                value={buValue}
                onChange={(event) => setBuValue(String(event.target.value))}
              >
                <MenuItem value="">(Bo trong / Chua gan)</MenuItem>
                {userData.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {buField === "collectionStatus" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bu-cs-label">Trang thai thu</InputLabel>
              <Select
                labelId="bu-cs-label"
                label="Trang thai thu"
                value={buValue}
                onChange={(event) => setBuValue(String(event.target.value))}
              >
                <MenuItem value="collected">Da thu</MenuItem>
                <MenuItem value="not_collected">Chua thu</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsBulkUpdateOpen(false)} color="inherit">
            Huy
          </Button>
          <Button
            onClick={handleApplyBulkUpdate}
            variant="contained"
            color="primary"
            disabled={
              !buField ||
              ((buField === "recordBookCode" || buField === "billing_period" || buField === "collectionStatus") &&
                !buValue)
            }
          >
            Ap dung
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
