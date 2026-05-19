// components/invoices/InvoiceToolbar.tsx

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
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import ListIcon from "@mui/icons-material/List";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { SelectChangeEvent } from "@mui/material/Select";
import { useState } from "react";
import { IUser } from "@/types/user";

type SearchType = "customerCode" | "stationCode";

// Định nghĩa props (đã được cập nhật với dấu '?')
interface InvoiceToolbarProps {
  invoicesCount?: number; // Cần cho logic 'disabled'
  onExport?: () => void;
  onExportPrinted?: () => void;
  invoicesPerPage?: number;
  onInvoicesPerPageChange?: (value: number) => void;
  onOpenAddDialog?: () => void;
  selectedInvoicesCount?: number; // Cần cho logic 'disabled'
  onDeleteSelected?: () => void;
  onOpenDeleteAllModal?: () => void;
  onOpenUploadWithProvince?: () => void;
  onOpenUploadPaidInvoices?: () => void;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  onOpenExportByUser?: () => void;
  searchType: SearchType; // Loại tìm kiếm hiện tại
  onSearchTypeChange: (type: SearchType) => void;
  onBulkSearch?: (codes: string[]) => void;
  // === Inline filters ===
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
  // Gán giá trị mặc định cho các prop có thể ảnh hưởng đến logic
  invoicesCount = 0,
  onExportPrinted,
  invoicesPerPage = 15,
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
  const isDeleteMenuOpen = Boolean(deleteMenuAnchor);

  // === State cho dialog cập nhật hàng loạt ===
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [buField, setBuField] = useState<"recordBookCode" | "assignedTo" | "billing_period" | "collectionStatus" | "">("");
  const [buValue, setBuValue] = useState<string>("");

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

  // Kiểu 'sx' chung cho các nút để tránh lặp code
  const commonButtonSx = {
    borderRadius: 2,
    textTransform: "none", // Giữ lại kiểu chữ thường
  };

  const searchLabel = searchType === "customerCode" ? "Tìm theo Mã KH" : "Tìm theo Mã trạm";

  const handleSearchTypeChange = (event: SelectChangeEvent) => {
    // Ép kiểu giá trị thành SearchType
    onSearchTypeChange(event.target.value as SearchType);
    // Khi thay đổi loại tìm kiếm, có thể bạn muốn xóa giá trị tìm kiếm cũ
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  const handleProcessBulkSearch = () => {
    if (onBulkSearch) {
      // Tách chuỗi theo xuống dòng, dấu phẩy hoặc khoảng trắng
      const codes = bulkValue
        .split(/[\n, ]+/)
        .map((code) => code.trim())
        .filter((code) => code !== "");

      // Giữ nguyên cả mã trùng để hiển thị đầy đủ khi tìm hàng loạt
      onBulkSearch(codes);
      setIsBulkDialogOpen(false);
      setBulkValue(""); // Reset sau khi tìm
    }
  };

  return (
    <>
      {/* --- Thanh điều khiển trên cùng --- */}
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
          {/* 1. Upload Excel + NPT (vàng) */}
          {onOpenUploadWithProvince && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenUploadWithProvince}
              sx={{ ...commonButtonSx, backgroundColor: "#facc15", color: "#fff", "&:hover": { backgroundColor: "#eab308" } }}
            >
              Upload Excel + NPT
            </Button>
          )}

          {/* 2. Cập nhật HĐ đã đóng cước (vàng) */}
          {onOpenUploadPaidInvoices && (
            <Button
              variant="contained"
              size="small"
              onClick={onOpenUploadPaidInvoices}
              sx={{ ...commonButtonSx, backgroundColor: "#facc15", color: "#fff", "&:hover": { backgroundColor: "#eab308" } }}
            >
              Cập nhật HĐ đã đóng cước
            </Button>
          )}

          {/* 3. Thêm HĐ mới (vàng) */}
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
              Thêm HĐ mới
            </Button>
          )}

          {/* 4. Xóa HĐ (xám, menu) */}
          {(onDeleteSelected || onOpenDeleteAllModal) && (
            <>
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowDropDownIcon />}
                onClick={(e) => setDeleteMenuAnchor(e.currentTarget)}
                sx={{ ...commonButtonSx, backgroundColor: "#6b7280", color: "#fff", "&:hover": { backgroundColor: "#4b5563" } }}
              >
                Xóa HĐ
              </Button>
              <Menu
                anchorEl={deleteMenuAnchor}
                open={isDeleteMenuOpen}
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

          {/* Cập nhật hàng loạt (xanh dương) */}
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

          {/* 4. Xuất Excel chọn lọc (xanh lá) */}
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
              Xuất Excel chọn lọc
            </Button>
          )}
        </Box>

        {/* Ô chọn số lượng hiển thị */}
        {onInvoicesPerPageChange && (
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 100, sm: 120 },
            }}
          >
            <InputLabel id="invoices-per-page-label">Hiển thị</InputLabel>
            <Select
              labelId="invoices-per-page-label"
              value={invoicesPerPage}
              label="Hiển thị"
              onChange={(e: SelectChangeEvent<number>) => onInvoicesPerPageChange(Number(e.target.value))}
            >
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
              <MenuItem value={300}>300</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {/* --- Hàng 2: Tìm theo + input + Tìm hàng loạt + Filters --- */}
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {onSearchChange && (
          <>
            <FormControl size="small" sx={{ minWidth: { xs: 110, sm: 130 } }}>
              <InputLabel id="search-type-label">Tìm theo</InputLabel>
              <Select labelId="search-type-label" value={searchType} label="Tìm theo" onChange={handleSearchTypeChange}>
                <MenuItem value="customerCode">Mã KH</MenuItem>
                <MenuItem value="stationCode">Mã trạm</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={searchLabel}
              size="small"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              inputProps={{ maxLength: 10 }}
              sx={{ width: { xs: 140, sm: 170 } }}
            />
          </>
        )}

        {/* Nút Tìm hàng loạt */}
        {onBulkSearch && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ListIcon />}
            onClick={() => setIsBulkDialogOpen(true)}
            sx={{ ...commonButtonSx, height: "40px" }}
          >
            Tìm hàng loạt
          </Button>
        )}

        {/* Filters: Trạng thái in bill / Trạng thái hóa đơn / Người phụ trách */}
        {onFilterPrintChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160 } }}>
            <InputLabel id="filter-print-label">Trạng thái in bill</InputLabel>
            <Select
              labelId="filter-print-label"
              value={filterPrint ?? "all"}
              label="Trạng thái in bill"
              onChange={(e: SelectChangeEvent) => onFilterPrintChange(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="printed">Đã in</MenuItem>
              <MenuItem value="notPrinted">Chưa in</MenuItem>
            </Select>
          </FormControl>
        )}

        {onFilterCollectionChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160 } }}>
            <InputLabel id="filter-collection-label">Trạng thái hóa đơn</InputLabel>
            <Select
              labelId="filter-collection-label"
              value={filterCollection ?? "all"}
              label="Trạng thái hóa đơn"
              onChange={(e: SelectChangeEvent) => onFilterCollectionChange(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="collected">Đã thu</MenuItem>
              <MenuItem value="not_collected">Chưa thu</MenuItem>
              <MenuItem value="is_paid">Đã đóng cước</MenuItem>
              <MenuItem value="duplicates" sx={{ color: "#ef4444", fontWeight: 600 }}>Mã trùng</MenuItem>
            </Select>
          </FormControl>
        )}

        {onFilterAssignedUserChange && (
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160 } }}>
            <InputLabel id="assigned-user-label">Người phụ trách</InputLabel>
            <Select
              labelId="assigned-user-label"
              value={filterAssignedUser ?? "all"}
              label="Người phụ trách"
              onChange={(e: SelectChangeEvent) => onFilterAssignedUserChange(e.target.value)}
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
      </Box>

      {/* --- DIALOG NHẬP MÃ HÀNG LOẠT --- */}
      <Dialog open={isBulkDialogOpen} onClose={() => setIsBulkDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
          <SearchIcon color="primary" /> Tìm kiếm hàng loạt mã
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            rows={20}
            placeholder={`Ví dụ:\nPB07090005082\nPB07090024645\nPB05030075757\n...`}
            variant="outlined"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsBulkDialogOpen(false)} color="inherit">
            Hủy bỏ
          </Button>
          <Button onClick={handleProcessBulkSearch} variant="contained" color="primary" disabled={!bulkValue.trim()}>
            Tìm kiếm ngay
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DIALOG CẬP NHẬT HÀNG LOẠT --- */}
      <Dialog open={isBulkUpdateOpen} onClose={() => setIsBulkUpdateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Cập nhật hàng loạt ({selectedInvoicesCount} hoá đơn)
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="bu-field-label">Trường cần cập nhật</InputLabel>
            <Select
              labelId="bu-field-label"
              label="Trường cần cập nhật"
              value={buField}
              onChange={(e) => {
                setBuField(e.target.value as typeof buField);
                setBuValue("");
              }}
            >
              <MenuItem value="recordBookCode">Mã trạm</MenuItem>
              <MenuItem value="assignedTo">Người phụ trách</MenuItem>
              <MenuItem value="billing_period">Kỳ TT</MenuItem>
              <MenuItem value="collectionStatus">Trạng thái thu</MenuItem>
            </Select>
          </FormControl>

          {buField === "recordBookCode" && (
            <TextField
              fullWidth
              size="small"
              label="Mã trạm mới"
              value={buValue}
              onChange={(e) => setBuValue(e.target.value)}
            />
          )}

          {buField === "billing_period" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bu-bp-label">Kỳ TT</InputLabel>
              <Select
                labelId="bu-bp-label"
                label="Kỳ TT"
                value={buValue}
                onChange={(e) => setBuValue(String(e.target.value))}
              >
                {billingPeriods.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {buField === "assignedTo" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bu-au-label">Người phụ trách</InputLabel>
              <Select
                labelId="bu-au-label"
                label="Người phụ trách"
                value={buValue}
                onChange={(e) => setBuValue(String(e.target.value))}
              >
                <MenuItem value="">(Bỏ trống / Chưa gán)</MenuItem>
                {userData.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {buField === "collectionStatus" && (
            <FormControl fullWidth size="small">
              <InputLabel id="bu-cs-label">Trạng thái thu</InputLabel>
              <Select
                labelId="bu-cs-label"
                label="Trạng thái thu"
                value={buValue}
                onChange={(e) => setBuValue(String(e.target.value))}
              >
                <MenuItem value="collected">Đã thu</MenuItem>
                <MenuItem value="not_collected">Chưa thu</MenuItem>
              </Select>
            </FormControl>
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
              !buField ||
              ((buField === "recordBookCode" || buField === "billing_period" || buField === "collectionStatus") &&
                !buValue)
            }
          >
            Áp dụng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
