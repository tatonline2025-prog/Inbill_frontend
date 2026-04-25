// components/invoices/InvoiceFilterBar.tsx

import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { IUser } from "@/types/user";

interface InvoiceFilterBarProps {
  filterPrint: string;
  onFilterPrintChange: (value: string) => void;
  filterCollection: string;
  onFilterCollectionChange: (value: string) => void;
  filterAssignedUser: string;
  onFilterAssignedUserChange: (value: string) => void;
  userData: IUser[];
}

export default function InvoiceFilterBar({
  filterPrint,
  onFilterPrintChange,
  filterCollection,
  onFilterCollectionChange,
  filterAssignedUser,
  onFilterAssignedUserChange,
  userData,
}: InvoiceFilterBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        mb: 2,
      }}
    >
      <FormControl
        size="small"
        sx={{
          minWidth: { xs: 140, sm: 160 },
          fontSize: { xs: "0.7rem", sm: "0.875rem" },
        }}
      >
        <InputLabel id="filter-print-label">Trạng thái in bill</InputLabel>
        <Select
          labelId="filter-print-label"
          value={filterPrint}
          label="Trạng thái in bill"
          onChange={(e: SelectChangeEvent) => onFilterPrintChange(e.target.value)}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="printed">Đã in</MenuItem>
          <MenuItem value="notPrinted">Chưa in</MenuItem>
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{
          minWidth: { xs: 140, sm: 160 },
          fontSize: { xs: "0.7rem", sm: "0.875rem" },
        }}
      >
        <InputLabel id="filter-collection-label">Trạng thái hóa đơn</InputLabel>
        <Select
          labelId="filter-collection-label"
          value={filterCollection}
          label="Trạng thái hóa đơn"
          onChange={(e: SelectChangeEvent) => onFilterCollectionChange(e.target.value)}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="collected">Đã thu</MenuItem>
          <MenuItem value="not_collected">Chưa thu</MenuItem>
          <MenuItem value="is_paid">Đã đóng cước</MenuItem>
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{
          minWidth: { xs: 140, sm: 160 },
          fontSize: { xs: "0.7rem", sm: "0.875rem" },
        }}
      >
        <InputLabel id="assigned-user-label">Người phụ trách</InputLabel>
        <Select
          labelId="assigned-user-label"
          value={filterAssignedUser}
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

      {/* Ô chọn 'Đã đóng cước' đã được gộp vào dropdown 'Trạng thái hóa đơn'. Ô 'Tỉnh' đã bỏ theo yêu cầu. */}
    </Box>
  );
}
