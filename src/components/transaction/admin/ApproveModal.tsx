"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { approveTransaction, getBanks } from "@/services/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  transactionId: string | null;
  onSuccess: () => void;
}

export default function ApproveModal({ open, onClose, transactionId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      await approveTransaction(transactionId);
      toast.success("Đã duyệt giao dịch thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Lỗi khi duyệt giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Duyệt Thanh Toán</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Xác nhận xét duyệt giao dịch này?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Hủy
        </Button>
        <Button onClick={handleApprove} variant="contained" color="success" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Xác nhận Duyệt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
