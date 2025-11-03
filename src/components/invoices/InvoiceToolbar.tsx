// components/invoices/InvoiceToolbar.tsx

import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import { SelectChangeEvent } from "@mui/material/Select";

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
  searchInvoiceNumber?: string;
  onSearchChange?: (search: string) => void;
  onOpenExportByUser?: () => void;
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
  searchInvoiceNumber = "",
  onSearchChange,
  onOpenExportByUser,
}: InvoiceToolbarProps) {
  // Kiểu 'sx' chung cho các nút để tránh lặp code
  const commonButtonSx = {
    borderRadius: 2,
    textTransform: "none", // Giữ lại kiểu chữ thường
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
          {/* Logic: Chỉ hiển thị nút nếu prop 'onExport' được truyền vào 
            Toán tử '&&' sẽ làm việc này một cách hoàn hảo
          */}

          {/* Nút Xuất Excel toàn bộ */}
          {onExport && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={onExport}
              disabled={invoicesCount === 0}
              sx={{
                ...commonButtonSx,
                minWidth: { xs: "120px", sm: "160px" },
              }}
            >
              Xuất ra Excel toàn bộ
            </Button>
          )}

          {/* Nút Xuất Excel đã thu */}
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
              Xuất ra Excel đã thu
            </Button>
          )}

          {/* Nút Xuất Excel theo người phụ trách */}
          {onOpenExportByUser && (
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={onOpenExportByUser}
              sx={{
                ...commonButtonSx,
                minWidth: { xs: "120px", sm: "160px" },
              }}
            >
              Xuất Excel Theo Người Phụ Trách
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

      {/* --- Hàng nút hành động --- */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        {/* Nút Thêm mới */}
        {onOpenAddDialog && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<AddIcon />}
            onClick={onOpenAddDialog}
            sx={commonButtonSx}
          >
            Thêm mới hoá đơn
          </Button>
        )}

        {/* Nút Xoá đã chọn */}
        {onDeleteSelected && (
          <Button
            variant="contained"
            color="error"
            size="small"
            disabled={selectedInvoicesCount === 0}
            onClick={onDeleteSelected}
            sx={commonButtonSx}
          >
            Xoá ({selectedInvoicesCount}) HĐ đã chọn
          </Button>
        )}

        {/* Nút Xoá tất cả */}
        {onOpenDeleteAllModal && (
          <Button variant="contained" color="warning" size="small" onClick={onOpenDeleteAllModal} sx={commonButtonSx}>
            Xoá tất cả hoá đơn theo kỳ
          </Button>
        )}

        {/* Nút Upload Excel */}
        {onOpenUploadWithProvince && (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<AddIcon />}
            onClick={onOpenUploadWithProvince}
            sx={commonButtonSx}
          >
            Upload Excel + Tỉnh
          </Button>
        )}
      </Box>

      {/* --- Ô tìm kiếm --- */}
      {onSearchChange && (
        <TextField
          label="Tìm theo Mã khách hàng"
          size="small"
          value={searchInvoiceNumber}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            minWidth: { xs: 150, sm: 200 },
            marginBottom: 3,
          }}
        />
      )}
    </>
  );
}
