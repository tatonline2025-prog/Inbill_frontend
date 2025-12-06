// src/components/admin/config/BankFormModal.tsx
"use client";
import React, { useState } from "react";
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
import { createBank } from "@/services/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BankFormModal({ open, onClose, onSuccess }: Props) {
  // Chỉ lưu trữ bankName
  const [bankName, setBankName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBankName(e.target.value);
  };

  const handleSubmit = async () => {
    if (!bankName.trim()) {
      toast.error("Vui lòng nhập tên ngân hàng.");
      return;
    }

    setLoading(true);
    try {
      // Gọi API chỉ với bankName
      await createBank({ bankName });
      toast.success("Thêm hình thức thanh toán thành công!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thêm mới.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form khi đóng
    setBankName("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Thêm Hình Thức Thanh Toán</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <TextField
            autoFocus
            label="Tên Ngân Hàng / Hình thức (VD: Vietcombank, Tiền mặt...)"
            name="bankName"
            fullWidth
            required
            variant="outlined"
            value={bankName}
            onChange={handleChange}
            placeholder="Nhập tên ngân hàng để admin chọn khi duyệt"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading || !bankName.trim()}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Lưu lại"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
