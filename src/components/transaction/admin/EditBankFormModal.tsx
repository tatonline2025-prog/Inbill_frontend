// src/components/admin/config/EditBankFormModal.tsx
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
  Box, // Dùng Box thay Grid vì chỉ còn 1 phần tử
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
  // Chỉ cần state lưu tên ngân hàng
  const [bankName, setBankName] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Đồng bộ dữ liệu từ prop 'bank' vào state form khi modal mở
  useEffect(() => {
    if (bank) {
      // Chỉ đồng bộ tên ngân hàng
      setBankName(bank.bankName || "");
    }
  }, [bank]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBankName(e.target.value);
  };

  const handleClose = () => {
    onClose();
    // Không cần reset state vì useEffect sẽ tự động tải lại dữ liệu mới khi modal mở lần sau
  };

  const handleSubmit = async () => {
    if (!bank) return;

    const trimmedBankName = bankName.trim();
    if (!trimmedBankName) {
      toast.error("Vui lòng nhập tên ngân hàng.");
      return;
    }

    setLoading(true);
    try {
      // Gửi request PUT/PATCH tới backend chỉ với bankName
      await updateBank(bank._id, { bankName: trimmedBankName });

      toast.success("Cập nhật tên ngân hàng/hình thức thanh toán thành công! 📝");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !bankName.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Chỉnh sửa Hình Thức Thanh Toán</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <TextField
            autoFocus
            label="Tên Ngân Hàng / Hình thức"
            name="bankName"
            fullWidth
            required
            variant="outlined"
            value={bankName}
            onChange={handleChange}
            placeholder="VD: Vietcombank, ACB, Tiền mặt"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isDisabled}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
