"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
} from "@mui/material";
import { InvoiceInfo } from "@/types/invoice";
import { IUser } from "@/types/user";
import toast from "react-hot-toast";
import axios from "axios";

interface EditInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceInfo | undefined;
  onSuccess: () => void;
  assignedUsers: IUser[];
}

export default function EditInvoiceDialog({
  open,
  onClose,
  invoice,
  onSuccess,
  assignedUsers,
}: EditInvoiceDialogProps) {
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/invoices/update/${invoice.invoiceNumber}`,
        {
          formData,
        }
      );

      if (res.status === 200) {
        toast.success("Cập nhật hoá đơn thành công!");
        onSuccess();
        onClose();
      } else {
        toast.error("Cập nhật thất bại, vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi cập nhật hoá đơn.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa hoá đơn {invoice?.invoiceNumber}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Tên khách hàng"
            value={formData.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
            fullWidth
          />
          <TextField
            label="Địa chỉ"
            value={formData.customerAddress}
            onChange={(e) => handleChange("customerAddress", e.target.value)}
            fullWidth
          />

          <TextField
            label="Kỳ này"
            type="number"
            value={formData.currentAmount}
            onChange={(e) => handleChange("currentAmount", e.target.value)}
            fullWidth
          />
          <TextField
            label="Kỳ trước"
            type="number"
            value={formData.previousAmount}
            onChange={(e) => handleChange("previousAmount", e.target.value)}
            fullWidth
          />
          <TextField
            label="Tổng tiền"
            type="number"
            value={formData.totalAmount}
            onChange={(e) => handleChange("totalAmount", e.target.value)}
            fullWidth
          />

          <TextField
            label="Ghi chú"
            value={formData.note}
            onChange={(e) => handleChange("note", e.target.value)}
            fullWidth
          />

          <TextField
            label="Kỳ hoá đơn"
            value={formData.billing_period}
            onChange={(e) => handleChange("billing_period", e.target.value)}
            placeholder="VD: 10/2025"
            fullWidth
          />

          <TextField
            label="Trạm"
            value={formData.recordBookCode}
            onChange={(e) => handleChange("recordBookCode", e.target.value)}
            fullWidth
          />

          <TextField
            label="Số điện thoại"
            value={formData.customerPhone}
            onChange={(e) => handleChange("customerPhone", e.target.value)}
            fullWidth
          />

          {assignedUsers.length > 1 && (
            <FormControl fullWidth>
              <InputLabel id="assigned-user-label">Nhân viên phụ trách</InputLabel>
              <Select
                labelId="assigned-user-label"
                value={formData.assignedTo}
                label="Nhân viên phụ trách"
                onChange={(e) => handleChange("assignedTo", e.target.value)}
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
