// components/invoices/InvoiceToolbar.tsx

import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import { SelectChangeEvent } from "@mui/material/Select";

// Định nghĩa props
interface InvoiceToolbarProps {
  invoicesCount: number;
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onExport: () => void;
  onExportPrinted: () => void;
  invoicesPerPage: number;
  onInvoicesPerPageChange: (value: number) => void;
  onOpenAddDialog: () => void;
  selectedInvoicesCount: number;
  onDeleteSelected: () => void;
  onOpenDeleteAllModal: () => void;
  onOpenUploadWithProvince: () => void;
  searchInvoiceNumber: string;
  onSearchChange: (search: string) => void;
}

export default function InvoiceToolbar({
  invoicesCount,
  selectedDate,
  onSelectedDateChange,
  onExport,
  onExportPrinted,
  invoicesPerPage,
  onInvoicesPerPageChange,
  onOpenAddDialog,
  selectedInvoicesCount,
  onDeleteSelected,
  onOpenDeleteAllModal,
  onOpenUploadWithProvince,
  searchInvoiceNumber,
  onSearchChange,
}: InvoiceToolbarProps) {
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={onExport}
            disabled={invoicesCount === 0}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
              minWidth: { xs: "120px", sm: "160px" },
            }}
          >
            Xuất ra Excel toàn bộ
          </Button>
          <TextField
            label="Chọn ngày thu"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => onSelectedDateChange(e.target.value)}
            sx={{
              minWidth: { xs: 120, sm: 180 },
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={onExportPrinted}
            disabled={invoicesCount === 0}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              backgroundColor: "#16a34a",
              "&:hover": { backgroundColor: "#15803d" },
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
              minWidth: { xs: "120px", sm: "160px" },
            }}
          >
            Xuất ra Excel đã thu
          </Button>
        </Box>
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 100, sm: 120 },
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
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
      </Box>

      {/* --- Hàng nút hành động --- */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={onOpenAddDialog}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
          Thêm mới hoá đơn
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={selectedInvoicesCount === 0}
          onClick={onDeleteSelected}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
          Xoá ({selectedInvoicesCount}) HĐ đã chọn
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onOpenDeleteAllModal}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
          Xoá tất cả hoá đơn theo kỳ
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={onOpenUploadWithProvince}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
          Upload Excel + Tỉnh
        </Button>
      </Box>

      {/* --- Ô tìm kiếm --- */}
      <TextField
        label="Tìm theo Mã khách hàng"
        size="small"
        value={searchInvoiceNumber}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{
          minWidth: { xs: 150, sm: 200 },
          fontSize: { xs: "0.7rem", sm: "0.875rem" },
          marginBottom: 3,
        }}
      />
    </>
  );
}
