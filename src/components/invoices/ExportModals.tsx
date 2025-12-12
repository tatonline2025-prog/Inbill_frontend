// components/invoices/ExportModals.tsx

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from "@mui/material";
import { IUser } from "@/types/user";
import { useState } from "react";

export const FILTER_STATUS = {
  ALL: "all",
  PAID: "collected", // Đã thu
  UNPAID: "not_collected", // Chưa thu
};

export const CLOSING_STATUS = {
  ALL: "all",
  TRUE: "true", // Đã đóng
  FALSE: "false", // Chưa đóng
};

interface ExportModalsProps {
  userData: IUser[];

  // --- Export By User ---
  openExportByUser: boolean;
  selectedExportUser: string;
  setOpenExportByUser: (open: boolean) => void;
  setSelectedExportUser: (userId: string) => void;
  handleExportByUserConfirm: () => Promise<void>;

  // --- Export Collected ---
  openExportCollected: boolean;
  setOpenExportCollected: (open: boolean) => void;
  handleExportCollectedConfirm: () => Promise<void>;

  // 1. Khoảng thời gian
  collectedFromDate: string;
  setCollectedFromDate: (date: string) => void;
  collectedToDate: string;
  setCollectedToDate: (date: string) => void;

  // 2. Chọn nhiều người (Mảng string)
  selectedCollectedUsers: string[];
  setSelectedCollectedUsers: (userIds: string[]) => void; // Lưu ý kiểu dữ liệu là mảng string[]

  // 3. Các trạng thái
  collectedStatus: string;
  setCollectedStatus: (status: string) => void;
  closingStatus: string;
  setClosingStatus: (status: string) => void;
}

export default function ExportModals({
  userData,

  // Export By User
  openExportByUser,
  selectedExportUser,
  setOpenExportByUser,
  setSelectedExportUser,
  handleExportByUserConfirm,

  // Export Collected
  openExportCollected,
  setOpenExportCollected,
  handleExportCollectedConfirm,

  // Nhận các props mới khai báo
  collectedFromDate,
  setCollectedFromDate,
  collectedToDate,
  setCollectedToDate,
  selectedCollectedUsers,
  setSelectedCollectedUsers,
  collectedStatus,
  setCollectedStatus,
  closingStatus,
  setClosingStatus,
}: ExportModalsProps) {
  const [dateFilterType, setDateFilterType] = useState("range");

  return (
    <>
      {/* Modal Export By User */}
      <Dialog open={openExportByUser} onClose={() => setOpenExportByUser(false)}>
        <DialogTitle>Chọn Người Phụ Trách</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Người phụ trách</InputLabel>
            <Select
              value={selectedExportUser}
              label="Người phụ trách"
              onChange={(e) => setSelectedExportUser(e.target.value)}
            >
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportByUser(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleExportByUserConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Export Collected */}
      <Dialog
        open={openExportCollected}
        onClose={() => setOpenExportCollected(false)}
        maxWidth="sm" // Tăng độ rộng modal một chút cho đẹp
        fullWidth
      >
        <DialogTitle
          sx={{
            paddingBottom: 0,
            borderBottom: "1px solid #eee",
          }}
        >
          Xuất Excel Hóa Đơn Chọn Lọc
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "16px !important" }}>
          <FormControl component="fieldset">
            <RadioGroup
              row
              name="dateFilterType"
              value={dateFilterType}
              onChange={(e) => {
                const newType = e.target.value;
                setDateFilterType(newType);

                setCollectedFromDate(collectedFromDate);
                setCollectedToDate(collectedFromDate);
              }}
            >
              <FormControlLabel value="single" control={<Radio size="small" />} label="Một ngày cụ thể" />
              <FormControlLabel value="range" control={<Radio size="small" />} label="Khoảng thời gian" />
            </RadioGroup>
          </FormControl>

          {dateFilterType === "single" ? (
            <TextField
              label="Chọn ngày"
              type="date"
              fullWidth
              margin="dense"
              value={collectedFromDate}
              onChange={(e) => {
                setCollectedFromDate(e.target.value);
                setCollectedToDate(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              helperText="Chọn ngày cần xuất báo cáo"
            />
          ) : (
            <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
              <TextField
                label="Từ ngày"
                type="date"
                fullWidth
                margin="dense"
                value={collectedFromDate}
                onChange={(e) => setCollectedFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Đến ngày"
                type="date"
                fullWidth
                margin="dense"
                value={collectedToDate}
                onChange={(e) => setCollectedToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </div>
          )}

          {/* 2. Chọn nhiều người phụ trách */}
          <FormControl fullWidth margin="dense">
            <InputLabel shrink={openExportCollected || selectedCollectedUsers.length > 0}>Người phụ trách</InputLabel>
            <Select
              multiple
              displayEmpty
              value={selectedCollectedUsers}
              label="Người phụ trách"
              onChange={(e) =>
                setSelectedCollectedUsers(
                  typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value
                )
              }
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <p>Tất cả người phụ trách</p>;
                }
                return selected.map((id) => userData.find((u) => u._id === id)?.fullName).join(", ");
              }}
            >
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <Checkbox checked={selectedCollectedUsers.indexOf(user._id) > -1} />
                  <ListItemText primary={user.fullName} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 3. Chọn trạng thái (2 ô nằm ngang) */}
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            {/* Trạng thái thu */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Trạng thái thu</InputLabel>
              <Select
                value={collectedStatus}
                label="Trạng thái thu"
                onChange={(e) => setCollectedStatus(e.target.value)}
              >
                <MenuItem value="paid">Đã thu</MenuItem>
                <MenuItem value="unpaid">Chưa thu</MenuItem>
              </Select>
            </FormControl>

            {/* Trạng thái đóng cước */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Đóng cước</InputLabel>
              <Select value={closingStatus} label="Đóng cước" onChange={(e) => setClosingStatus(e.target.value)}>
                <MenuItem value="true">Đã đóng</MenuItem>
                <MenuItem value="false">Chưa đóng</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportCollected(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleExportCollectedConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
