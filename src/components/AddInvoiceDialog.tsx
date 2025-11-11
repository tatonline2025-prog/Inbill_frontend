"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
} from "@mui/material";
import { createInvoice_API, fetchLatestPeriod_API } from "@/services/invoice.api";

export default function AddInvoiceDialog({
  open,
  onClose,
  onSuccess,
  assignedUsers = [],
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignedUsers?: { _id: string; fullName: string }[];
}) {
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    billing_period: "",
    currentAmount: "",
    previousAmount: "0",
    recordBookCode: "",
    assignedTo: "",
  });

  const [billingPeriod, setBillingPeriod] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLatestPeriod = async () => {
      try {
        const res = await fetchLatestPeriod_API();

        if (res.billing_period) {
          setBillingPeriod(res.billing_period);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchLatestPeriod();
  }, []);

  useEffect(() => {
    if (open) {
      setNewInvoice((prev) => ({
        ...prev,
        billing_period: billingPeriod || "",
      }));
    }
  }, [open, billingPeriod]);

  const handleChange = (field: string, value: string) => {
    setNewInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !newInvoice.invoiceNumber ||
      !newInvoice.customerName ||
      !newInvoice.billing_period ||
      !newInvoice.previousAmount ||
      !newInvoice.currentAmount
    ) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      setLoading(true);
      await createInvoice_API(newInvoice);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi khi tạo hoá đơn:", error);
      alert("Không thể tạo hóa đơn. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm mới hóa đơn</DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto", // nếu nhiều ô, tránh bị cắt
        }}
      >
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Mã khách hàng"
            value={newInvoice.invoiceNumber}
            onChange={(e) => handleChange("invoiceNumber", e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Tên khách hàng"
            value={newInvoice.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Số điện thoại"
            value={newInvoice.customerPhone}
            onChange={(e) => handleChange("customerPhone", e.target.value)}
            fullWidth
          />
          <TextField
            label="Địa chỉ"
            value={newInvoice.customerAddress}
            onChange={(e) => handleChange("customerAddress", e.target.value)}
            fullWidth
          />
          <TextField
            label="Tháng nợ (VD: 10/2025)"
            value={newInvoice.billing_period}
            onChange={(e) => handleChange("billing_period", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Tiền nợ kỳ này (VNĐ)"
            type="number"
            value={newInvoice.currentAmount}
            onChange={(e) => handleChange("currentAmount", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Tiền nợ kỳ trước (VNĐ)"
            type="number"
            value={newInvoice.previousAmount}
            onChange={(e) => handleChange("previousAmount", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Trạm"
            value={newInvoice.recordBookCode}
            onChange={(e) => handleChange("recordBookCode", e.target.value)}
            fullWidth
          />

          {assignedUsers && assignedUsers.length > 0 && (
            <FormControl fullWidth>
              <InputLabel id="assigned-user-label">Nhân viên phụ trách</InputLabel>
              <Select
                labelId="assigned-user-label"
                label="Nhân viên phụ trách"
                value={newInvoice.assignedTo}
                onChange={(e) => handleChange("assignedTo", e.target.value)}
              >
                <MenuItem value="">-- Chưa chọn --</MenuItem>
                {assignedUsers.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    {u.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button variant="contained" color="success" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
