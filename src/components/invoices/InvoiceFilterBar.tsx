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
  selectedProvince: string;
  onSelectedProvinceChange: (value: string) => void;
  userData: IUser[];
  provinces: string[];
}

export default function InvoiceFilterBar({
  filterPrint,
  onFilterPrintChange,
  filterCollection,
  onFilterCollectionChange,
  filterAssignedUser,
  onFilterAssignedUserChange,
  selectedProvince,
  onSelectedProvinceChange,
  userData,
  provinces,
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
        <InputLabel id="filter-collection-label">Trạng thái thu tiền</InputLabel>
        <Select
          labelId="filter-collection-label"
          value={filterCollection}
          label="Trạng thái thu tiền"
          onChange={(e: SelectChangeEvent) => onFilterCollectionChange(e.target.value)}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="collected">Đã thu</MenuItem>
          <MenuItem value="notCollected">Chưa thu</MenuItem>
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

      <FormControl
        size="small"
        sx={{
          minWidth: { xs: 140, sm: 160 },
          fontSize: { xs: "0.7rem", sm: "0.875rem" },
        }}
      >
        <InputLabel id="province-label">Tỉnh</InputLabel>
        <Select
          labelId="province-label"
          value={selectedProvince}
          label="Tỉnh"
          onChange={(e: SelectChangeEvent) => onSelectedProvinceChange(e.target.value)}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          {provinces.map((province) => (
            <MenuItem key={province} value={province}>
              {province}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
