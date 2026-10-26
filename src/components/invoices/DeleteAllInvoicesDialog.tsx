import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from "@mui/material";
import toast from "react-hot-toast";

import { useExpandableBillingPeriods } from "@/hooks/useExpandableBillingPeriods";
import { getDefaultBillingPeriod } from "@/lib/billing-period";
import { deleteInvoicesByBillingPeriodAndUser_API } from "@/services/invoice.api";
import { IUser } from "@/types/user";

interface DeleteAllInvoicesDialogProps {
  open: boolean;
  onClose: () => void;
  assignedUsers: IUser[];
  onDeleteSuccess: () => void;
}

export default function DeleteAllInvoicesDialog({
  open,
  onClose,
  assignedUsers,
  onDeleteSuccess,
}: DeleteAllInvoicesDialogProps) {
  const [defaultBillingPeriod, setDefaultBillingPeriod] = useState("");
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("");
  const [selectedAssignedUsers, setSelectedAssignedUsers] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { visiblePeriods, expandPeriods } = useExpandableBillingPeriods({
    basePeriod: defaultBillingPeriod,
    resetKey: open,
    selectedPeriod: selectedBillingPeriod,
  });

  const sortedUsers = useMemo(
    () =>
      [...assignedUsers].sort((left, right) =>
        String(left.fullName || left.username || "").localeCompare(String(right.fullName || right.username || ""), "vi")
      ),
    [assignedUsers]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaultPeriod = getDefaultBillingPeriod();
    setDefaultBillingPeriod(defaultPeriod);
    setSelectedBillingPeriod(defaultPeriod);
    setSelectedAssignedUsers([]);
  }, [open]);

  const handleClose = () => {
    onClose();
    setSelectedBillingPeriod("");
    setSelectedAssignedUsers([]);
  };

  const handleDelete = async () => {
    if (!selectedBillingPeriod || selectedAssignedUsers.length === 0 || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await deleteInvoicesByBillingPeriodAndUser_API(
        selectedBillingPeriod,
        selectedAssignedUsers
      );
      toast.success(response.data?.message || `Đã xóa hóa đơn kỳ ${selectedBillingPeriod}`);
      onDeleteSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xóa hóa đơn theo kỳ hoặc người phụ trách.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => { if (!isDeleting) handleClose(); }} fullWidth maxWidth="sm">
      <DialogTitle>Xóa hóa đơn theo kỳ / người phụ trách</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
          <FormControl fullWidth disabled={isDeleting}>
            <InputLabel id="delete-billing-period-label">Chọn kỳ hóa đơn</InputLabel>
            <Select
              labelId="delete-billing-period-label"
              label="Chọn kỳ hóa đơn"
              value={selectedBillingPeriod}
              onChange={(event) => setSelectedBillingPeriod(event.target.value)}
            >
              {visiblePeriods.map((period) => (
                <MenuItem key={period} value={period}>
                  {period}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={expandPeriods} disabled={isDeleting} sx={{ minWidth: 44, px: 0 }}>
            +
          </Button>
        </Box>

        <FormControl fullWidth disabled={isDeleting}>
          <InputLabel id="delete-assigned-user-label" shrink>Người phụ trách</InputLabel>
          <Select
            multiple
            displayEmpty
            labelId="delete-assigned-user-label"
            label="Người phụ trách"
            value={selectedAssignedUsers}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedAssignedUsers(typeof value === "string" ? value.split(",") : value);
            }}
            renderValue={(selected) => {
              if (selected.length === 0) return "Chọn người phụ trách";
              if (selected.length > 2) return `Đã chọn ${selected.length} người phụ trách`;
              return selected.map((id) => {
                if (id === "no_one") return "Chưa phụ trách";
                const user = sortedUsers.find((entry) => entry._id === id);
                return user?.fullName || user?.username || id;
              }).join(", ");
            }}
          >
            {sortedUsers.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                <Checkbox checked={selectedAssignedUsers.includes(user._id)} />
                <ListItemText primary={user.fullName || user.username} />
              </MenuItem>
            ))}
            <MenuItem value="no_one">
              <Checkbox checked={selectedAssignedUsers.includes("no_one")} />
              <ListItemText primary="Chưa phụ trách" />
            </MenuItem>
          </Select>
          <FormHelperText>Chọn một hoặc nhiều người phụ trách để xóa hóa đơn trong kỳ đã chọn.</FormHelperText>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isDeleting}>Hủy</Button>
        <Button variant="contained" color="error" disabled={!selectedBillingPeriod || selectedAssignedUsers.length === 0 || isDeleting} onClick={handleDelete}>
          {isDeleting ? "Đang xóa..." : "Xóa theo người đã chọn"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
