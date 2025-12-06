"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Grid,
} from "@mui/material";
import toast from "react-hot-toast";
import { ITransactionPaymentBank } from "@/types/transaction";
import { updateBank } from "@/services/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  bank: ITransactionPaymentBank | null; // Dữ liệu ngân hàng cần sửa
  onSuccess: () => void;
}

export default function EditBankFormModal({ open, onClose, bank, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    branch: "",
  });
  const [loading, setLoading] = useState(false);

  // 1. Đồng bộ dữ liệu từ prop 'bank' vào state form khi modal mở
  useEffect(() => {
    if (bank) {
      setFormData({
        bankName: bank.bankName || "",
        accountNumber: bank.accountNumber || "",
        accountHolder: bank.accountHolder || "",
        branch: bank.branch || "",
      });
    }
  }, [bank]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!bank) return;

    const { bankName, accountNumber, accountHolder } = formData;
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("Vui lòng điền đủ các trường bắt buộc.");
      return;
    }

    setLoading(true);
    try {
      // Gửi request PUT/PATCH tới backend
      await updateBank(bank._id, formData);

      toast.success("Cập nhật thông tin ngân hàng thành công!");
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error("Lỗi khi cập nhật ngân hàng.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !formData.bankName || !formData.accountNumber || !formData.accountHolder;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Chỉnh sửa Tài Khoản Ngân Hàng</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid>
            <TextField
              autoFocus
              label="Tên Ngân Hàng"
              name="bankName"
              fullWidth
              required
              value={formData.bankName}
              onChange={handleChange}
            />
          </Grid>

          <Grid>
            <TextField
              label="Số Tài Khoản"
              name="accountNumber"
              type="number"
              fullWidth
              required
              value={formData.accountNumber}
              onChange={handleChange}
            />
          </Grid>

          <Grid>
            <TextField
              label="Tên Chủ Tài Khoản"
              name="accountHolder"
              fullWidth
              required
              value={formData.accountHolder}
              onChange={handleChange}
            />
          </Grid>

          <Grid>
            <TextField
              label="Chi nhánh (Tùy chọn)"
              name="branch"
              fullWidth
              value={formData.branch}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isDisabled}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
