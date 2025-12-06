// src/components/admin/config/TransactionTypeFormModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import toast from "react-hot-toast";
import { createTransactionType, getBanks } from "@/services/transaction";
import { ITransactionPaymentBank } from "@/types/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Reload danh sách cha
}

export default function TransactionTypeFormModal({ open, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate cơ bản
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên loại giao dịch");
      return;
    }

    setLoading(true);
    try {
      await createTransactionType(name, description);

      toast.success("Tạo loại giao dịch thành công!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo loại giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form khi đóng
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tạo Loại Giao Dịch Mới</DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          label="Tên Loại Giao Dịch (Ví dụ: Thẻ Garena, Nạp Vina...)"
          type="text"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Mô tả"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !name}>
          {loading ? <CircularProgress size={20} /> : "Tạo mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
