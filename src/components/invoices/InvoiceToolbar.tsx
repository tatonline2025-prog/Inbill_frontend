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
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ListIcon from "@mui/icons-material/List";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { SelectChangeEvent } from "@mui/material/Select";
import { useState } from "react";

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
}

export default function InvoiceToolbar({
  // Gán giá trị mặc định cho các prop có thể ảnh hưởng đến logic
  invoicesCount = 0,
  onExport,
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
  onOpenExportByUser,
  searchType,
  onSearchTypeChange,
  onBulkSearch,
}: InvoiceToolbarProps) {
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState("");
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(null);
  const isDeleteMenuOpen = Boolean(deleteMenuAnchor);

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
          {/* 1. Upload Excel + NPT */}
          {onOpenUploadWithProvince && (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<AddIcon />}
              onClick={onOpenUploadWithProvince}
              sx={commonButtonSx}
            >
              Upload Excel + NPT
            </Button>
          )}

          {/* 2. Xóa hóa đơn (menu) */}
          {(onDeleteSelected || onOpenDeleteAllModal) && (
            <>
              <Button
                variant="contained"
                color="warning"
                size="small"
                endIcon={<ArrowDropDownIcon />}
                onClick={(e) => setDeleteMenuAnchor(e.currentTarget)}
                sx={commonButtonSx}
              >
                Xóa hóa đơn
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
                    Xóa hóa đơn đang chọn ({selectedInvoicesCount})
                  </MenuItem>
                )}
                {onOpenDeleteAllModal && (
                  <MenuItem
                    onClick={() => {
                      setDeleteMenuAnchor(null);
                      onOpenDeleteAllModal();
                    }}
                  >
                    Xóa hóa đơn theo kỳ
                  </MenuItem>
                )}
              </Menu>
            </>
          )}

          {/* 3. Cập nhật HĐ đã đóng cước */}
          {onOpenUploadPaidInvoices && (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<AddIcon />}
              onClick={onOpenUploadPaidInvoices}
              sx={commonButtonSx}
            >
              Cập nhật HĐ đã đóng cước
            </Button>
          )}

          {/* 4. Xuất Excel chọn lọc */}
          {onExportPrinted && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={onExportPrinted}
              disabled={invoicesCount === 0}
              sx={{
                ...commonButtonSx,
                minWidth: { xs: "120px", sm: "160px" },
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
              <MenuItem value={15}>15</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
              <MenuItem value={300}>300</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {/* --- Hàng 2: Tìm theo + input + Tìm hàng loạt + Thêm hóa đơn mới --- */}
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {onSearchChange && (
          <>
            <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 150 } }}>
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
              sx={{ minWidth: { xs: 150, sm: 250 } }}
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

        {/* Nút Thêm hóa đơn mới */}
        {onOpenAddDialog && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<AddIcon />}
            onClick={onOpenAddDialog}
            sx={{ ...commonButtonSx, height: "40px" }}
          >
            Thêm hóa đơn mới
          </Button>
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
    </>
  );
}
