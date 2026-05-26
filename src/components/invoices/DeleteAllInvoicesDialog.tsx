import { useEffect, useMemo, useState } from "react";
import {
  Box,
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

import { useExpandableBillingPeriods } from "@/hooks/useExpandableBillingPeriods";
import { getCurrentBillingPeriod, normalizeBillingPeriod, sortBillingPeriodsAsc } from "@/lib/billing-period";
import {
  deleteInvoicesByBillingPeriodAndUser_API,
  fetchBillingPeriods_API,
  fetchLatestPeriod_API,
} from "@/services/invoice.api";
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
  const [selectedAssignedUser, setSelectedAssignedUser] = useState("all");

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

    let isActive = true;

    const loadDefaultBillingPeriod = async () => {
      try {
        const [billingPeriodsResponse, latestPeriodResponse] = await Promise.all([
          fetchBillingPeriods_API().catch(() => null),
          fetchLatestPeriod_API().catch(() => null),
        ]);
        const sortedBillingPeriods = sortBillingPeriodsAsc(billingPeriodsResponse?.periods || []);
        const nextPeriod =
          sortedBillingPeriods[0] ||
          normalizeBillingPeriod(latestPeriodResponse?.billing_period) ||
          getCurrentBillingPeriod();

        if (!isActive) {
          return;
        }

        setDefaultBillingPeriod(nextPeriod);
        setSelectedBillingPeriod(nextPeriod);
      } catch (error) {
        console.error(error);

        if (!isActive) {
          return;
        }

        const fallbackPeriod = getCurrentBillingPeriod();
        setDefaultBillingPeriod(fallbackPeriod);
        setSelectedBillingPeriod(fallbackPeriod);
      }
    };

    loadDefaultBillingPeriod();

    return () => {
      isActive = false;
    };
  }, [open]);

  const handleClose = () => {
    onClose();
    setSelectedBillingPeriod("");
    setSelectedAssignedUser("all");
  };

  const handleDelete = async () => {
    if (!selectedBillingPeriod) {
      return;
    }

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
        <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
          <FormControl fullWidth>
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

          <Button variant="outlined" onClick={expandPeriods} sx={{ minWidth: 44, px: 0 }}>
            +
          </Button>
        </Box>

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
