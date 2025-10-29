// components/invoices/DeleteAllInvoicesDialog.tsx

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { deleteInvoicesByBillingPeriod_API } from "@/services/invoice.api";
import toast from "react-hot-toast";

interface DeleteAllInvoicesDialogProps {
  open: boolean;
  onClose: () => void;
  billingPeriods: string[];
  onDeleteSuccess: () => void;
}

export default function DeleteAllInvoicesDialog({
  open,
  onClose,
  billingPeriods,
  onDeleteSuccess,
}: DeleteAllInvoicesDialogProps) {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("");

  const handleDelete = async () => {
    try {
      await deleteInvoicesByBillingPeriod_API(selectedBillingPeriod);
      toast.success(`Đã xoá toàn bộ hoá đơn kỳ ${selectedBillingPeriod}`);
      onDeleteSuccess();
      onClose();
      setSelectedBillingPeriod(""); // Reset
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xoá hoá đơn của kỳ này!");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Xoá tất cả hoá đơn theo kỳ</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column" }}>
        <FormControl fullWidth sx={{ minWidth: 300 }}>
          <InputLabel id="billing-period-label">Chọn kỳ hoá đơn</InputLabel>
          <Select
            labelId="billing-period-label"
            label="Chọn kỳ hoá đơn"
            value={selectedBillingPeriod}
            onChange={(e) => setSelectedBillingPeriod(e.target.value)}
          >
            {billingPeriods.map((period) => (
              <MenuItem key={period} value={period}>
                {period}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" color="error" disabled={!selectedBillingPeriod} onClick={handleDelete}>
          Xoá
        </Button>
      </DialogActions>
    </Dialog>
  );
}
