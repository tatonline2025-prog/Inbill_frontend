// src/components/admin/config/TransactionTypeFormModal.tsx
"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";

import { updateTransactionType } from "@/services/transaction";
import { ITransactionType } from "@/types/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  transactionType: ITransactionType | null;
  onSuccess: () => void; // Reload danh sách cha
}

export default function EditTransactionTypeFormModal({ open, onClose, transactionType, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transactionType) {
      setName(transactionType.name || "");
      setDescription(transactionType.description || "");
    }
  }, [transactionType]);

  const handleClose = () => {
    onClose();
    // Reset form khi đóng (để tránh lỗi hiển thị khi mở lại)
    setName("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!transactionType) {
      toast.error("Không tìm thấy đối tượng cần cập nhật.");
      return;
    }

    // Validate cơ bản
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên loại giao dịch");
      return;
    }

    setLoading(true);
    try {
      await updateTransactionType(
        transactionType._id, // Truyền ID của đối tượng cần sửa
        name,
        description
      );

      toast.success("Cập nhật loại giao dịch thành công!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi cập nhật loại giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name && !loading;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh Sửa Loại Giao Dịch</DialogTitle>
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

        <Button onClick={handleSubmit} variant="contained" disabled={!isFormValid}>
          {loading ? <CircularProgress size={20} /> : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
