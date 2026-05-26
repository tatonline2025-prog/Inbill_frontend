"use client";

import { useEffect, useState } from "react";
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
  TextField,
} from "@mui/material";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

import { useExpandableBillingPeriods } from "@/hooks/useExpandableBillingPeriods";
import { getCurrentBillingPeriod, normalizeBillingPeriod, sortBillingPeriodsAsc } from "@/lib/billing-period";
import { fetchBillingPeriods_API, fetchLatestPeriod_API, updateInvoice } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { IUser } from "@/types/user";

interface EditInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceInfo | undefined;
  onSuccess: (updatedInvoice?: InvoiceInfo) => void;
  assignedUsers: IUser[];
}

export default function EditInvoiceDialog({
  open,
  onClose,
  invoice,
  onSuccess,
  assignedUsers,
}: EditInvoiceDialogProps) {
  const [baseBillingPeriod, setBaseBillingPeriod] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    currentAmount: "",
    previousAmount: "",
    totalAmount: "",
    note: "",
    recordBookCode: "",
    assignedTo: "",
    billing_period: "",
  });

  const { visiblePeriods, expandPeriods } = useExpandableBillingPeriods({
    basePeriod: baseBillingPeriod,
    fallbackPeriods: [invoice?.billing_period || ""],
    resetKey: `${open}-${invoice?._id ?? ""}`,
    selectedPeriod: formData.billing_period,
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        customerName: invoice.customerName || "",
        customerAddress: invoice.customerAddress || "",
        customerPhone: invoice.customerPhone || "",
        currentAmount: invoice.currentAmount || "",
        previousAmount: invoice.previousAmount || "",
        totalAmount: invoice.totalAmount || "",
        note: invoice.note || "",
        recordBookCode: invoice.recordBookCode || "",
        assignedTo: invoice.assignedTo?._id || "",
        billing_period: invoice.billing_period || "",
      });
    }
  }, [invoice]);

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
          normalizeBillingPeriod(invoice?.billing_period) ||
          normalizeBillingPeriod(latestPeriodResponse?.billing_period) ||
          getCurrentBillingPeriod();

        if (!isActive) {
          return;
        }

        setBaseBillingPeriod(nextPeriod);
      } catch (error) {
        console.error(error);

        if (!isActive) {
          return;
        }

        setBaseBillingPeriod(
          normalizeBillingPeriod(invoice?.billing_period) || getCurrentBillingPeriod()
        );
      }
    };

    loadDefaultBillingPeriod();

    return () => {
      isActive = false;
    };
  }, [invoice?.billing_period, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!invoice) {
      return;
    }

    try {
      const normalizedForm = {
        ...formData,
        _id: invoice._id,
        customerName: formData.customerName.trim() || "",
        billing_period: formData.billing_period.trim() || "",
        currentAmount: formData.currentAmount?.toString().trim() || "0",
        previousAmount: formData.previousAmount?.toString().trim() || "0",
        totalAmount: formData.totalAmount?.toString().trim() || "0",
      };

      const response = await updateInvoice(normalizedForm, invoice._id);

      const selectedAssignedUser = assignedUsers.find((user) => user._id === normalizedForm.assignedTo);
      const nextAssignedTo =
        normalizedForm.assignedTo && selectedAssignedUser
          ? {
              _id: selectedAssignedUser._id,
              fullName: selectedAssignedUser.fullName,
              email: selectedAssignedUser.email,
            }
          : invoice.assignedTo ?? null;

      const localUpdatedInvoice: InvoiceInfo = {
        ...invoice,
        ...normalizedForm,
        assignedTo: nextAssignedTo,
      };

      toast.success(response.message || "Cập nhật hóa đơn thành công.");
      onSuccess(localUpdatedInvoice);
      onClose();
    } catch (error) {
      console.error(error);

      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage) {
          toast.error(`Lỗi: ${errorMessage}`);
        } else {
          toast.error("Đã xảy ra lỗi khi cập nhật hóa đơn. Vui lòng thử lại.");
        }
        return;
      }

      toast.error("Đã xảy ra lỗi khi cập nhật hóa đơn. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa hóa đơn {invoice?.invoiceNumber}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Kỳ này"
            type="number"
            value={formData.currentAmount}
            onChange={(event) => handleChange("currentAmount", event.target.value)}
            fullWidth
          />
          <TextField
            label="Kỳ trước"
            type="number"
            value={formData.previousAmount}
            onChange={(event) => handleChange("previousAmount", event.target.value)}
            fullWidth
          />
          <TextField
            label="Tổng tiền"
            type="number"
            value={formData.totalAmount}
            onChange={(event) => handleChange("totalAmount", event.target.value)}
            fullWidth
          />

          <TextField
            label="Tên khách hàng"
            value={formData.customerName}
            onChange={(event) => handleChange("customerName", event.target.value)}
            fullWidth
          />
          <TextField
            label="Địa chỉ"
            value={formData.customerAddress}
            onChange={(event) => handleChange("customerAddress", event.target.value)}
            fullWidth
          />

          <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
            <FormControl fullWidth>
              <InputLabel id="edit-billing-period-label">Kỳ hóa đơn</InputLabel>
              <Select
                labelId="edit-billing-period-label"
                label="Kỳ hóa đơn"
                value={formData.billing_period}
                onChange={(event) => handleChange("billing_period", event.target.value)}
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

          <TextField
            label="Trạm"
            value={formData.recordBookCode}
            onChange={(event) => handleChange("recordBookCode", event.target.value)}
            fullWidth
          />

          {assignedUsers.length > 1 && (
            <FormControl fullWidth>
              <InputLabel id="assigned-user-label">Nhân viên phụ trách</InputLabel>
              <Select
                labelId="assigned-user-label"
                value={formData.assignedTo}
                label="Nhân viên phụ trách"
                onChange={(event) => handleChange("assignedTo", event.target.value)}
              >
                <MenuItem value="">
                  <em>Chọn nhân viên</em>
                </MenuItem>
                {assignedUsers.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.fullName || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Hủy
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
