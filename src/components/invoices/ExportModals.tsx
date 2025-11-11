// components/invoices/ExportModals.tsx

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { IUser } from "@/types/user";

interface ExportModalsProps {
  userData: IUser[];

  // Export By User
  openExportByUser: boolean;
  selectedExportUser: string;
  setOpenExportByUser: (open: boolean) => void;
  setSelectedExportUser: (userId: string) => void;
  handleExportByUserConfirm: () => Promise<void>;

  // Export Collected
  openExportCollected: boolean;
  selectedCollectedDate: string;
  selectedCollectedUser: string;
  setOpenExportCollected: (open: boolean) => void;
  setSelectedCollectedDate: (date: string) => void;
  setSelectedCollectedUser: (userId: string) => void;
  handleExportCollectedConfirm: () => Promise<void>;
}

export default function ExportModals({
  userData,
  openExportByUser,
  selectedExportUser,
  setOpenExportByUser,
  setSelectedExportUser,
  handleExportByUserConfirm,
  openExportCollected,
  selectedCollectedDate,
  selectedCollectedUser,
  setOpenExportCollected,
  setSelectedCollectedDate,
  setSelectedCollectedUser,
  handleExportCollectedConfirm,
}: ExportModalsProps) {
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
      <Dialog open={openExportCollected} onClose={() => setOpenExportCollected(false)}>
        <DialogTitle>Xuất Excel Hóa Đơn Đã Thu</DialogTitle>
        <DialogContent sx={{ minWidth: 400, paddingTop: "16px !important" }}>
          <TextField
            label="Chọn ngày thu"
            type="date"
            fullWidth
            margin="dense"
            value={selectedCollectedDate}
            onChange={(e) => setSelectedCollectedDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Người phụ trách</InputLabel>
            <Select
              value={selectedCollectedUser}
              label="Người phụ trách"
              onChange={(e) => setSelectedCollectedUser(e.target.value)}
            >
              <MenuItem value="all">
                <em>Tất cả người phụ trách</em>
              </MenuItem>
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
