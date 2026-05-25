import { useMemo, useState } from "react";
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
} from "@mui/material";
import toast from "react-hot-toast";

import { deleteInvoicesByBillingPeriodAndUser_API } from "@/services/invoice.api";
import { IUser } from "@/types/user";

interface DeleteAllInvoicesDialogProps {
  open: boolean;
  onClose: () => void;
  billingPeriods: string[];
  assignedUsers: IUser[];
  onDeleteSuccess: () => void;
}

export default function DeleteAllInvoicesDialog({
  open,
  onClose,
  billingPeriods,
  assignedUsers,
  onDeleteSuccess,
}: DeleteAllInvoicesDialogProps) {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("");
  const [selectedAssignedUser, setSelectedAssignedUser] = useState("all");

  const sortedUsers = useMemo(
    () =>
      [...assignedUsers].sort((left, right) =>
        String(left.fullName || left.username || "").localeCompare(String(right.fullName || right.username || ""), "vi")
      ),
    [assignedUsers]
  );

  const handleClose = () => {
    onClose();
    setSelectedBillingPeriod("");
    setSelectedAssignedUser("all");
  };

  const handleDelete = async () => {
    if (!selectedBillingPeriod) return;

    try {
      const response = await deleteInvoicesByBillingPeriodAndUser_API(
        selectedBillingPeriod,
        selectedAssignedUser === "all" ? undefined : selectedAssignedUser
      );
      toast.success(response.data?.message || `Đã xóa hóa đơn kỳ ${selectedBillingPeriod}`);
      onDeleteSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xóa hóa đơn theo kỳ hoặc người phụ trách.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Xóa hóa đơn theo kỳ / người phụ trách</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <FormControl fullWidth>
          <InputLabel id="delete-billing-period-label">Chọn kỳ hóa đơn</InputLabel>
          <Select
            labelId="delete-billing-period-label"
            label="Chọn kỳ hóa đơn"
            value={selectedBillingPeriod}
            onChange={(event) => setSelectedBillingPeriod(event.target.value)}
          >
            {billingPeriods.map((period) => (
              <MenuItem key={period} value={period}>
                {period}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="delete-assigned-user-label">Người phụ trách</InputLabel>
          <Select
            labelId="delete-assigned-user-label"
            label="Người phụ trách"
            value={selectedAssignedUser}
            onChange={(event) => setSelectedAssignedUser(event.target.value)}
          >
            <MenuItem value="all">Tất cả người phụ trách</MenuItem>
            {sortedUsers.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.fullName || user.username}
              </MenuItem>
            ))}
            <MenuItem value="no_one">Chưa phụ trách</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button variant="contained" color="error" disabled={!selectedBillingPeriod} onClick={handleDelete}>
          Xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
}
