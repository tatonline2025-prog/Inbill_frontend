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
  Grid,
} from "@mui/material";
import toast from "react-hot-toast";
import { createBank } from "@/services/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BankFormModal({ open, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    branch: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { bankName, accountNumber, accountHolder } = formData;
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("Vui lòng điền đủ các trường bắt buộc.");
      return;
    }

    setLoading(true);
    try {
      await createBank(formData); // Gọi POST API
      toast.success("Thêm thông tin ngân hàng thành công! 🏦");
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error("Lỗi khi thêm ngân hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form khi đóng
    setFormData({ bankName: "", accountNumber: "", accountHolder: "", branch: "" });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {" "}
      {/* Đổi max width sang 'sm' cho phù hợp với form */}
      <DialogTitle sx={{ fontWeight: "bold" }}>Thêm Tài Khoản Ngân Hàng Công Ty</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {" "}
          {/* spacing={3} tạo khoảng cách đẹp hơn */}
          {/* Tên Ngân Hàng (Chiếm 1 hàng ngang) */}
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
          {/* Số Tài Khoản (Nửa hàng) */}
          <Grid>
            <TextField
              label="Số Tài Khoản"
              name="accountNumber"
              type="number" // Đảm bảo chỉ nhập số
              fullWidth
              required
              value={formData.accountNumber}
              onChange={handleChange}
            />
          </Grid>
          {/* Tên Chủ Tài Khoản (Nửa hàng) */}
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
          {/* Chi nhánh (Chiếm 1 hàng ngang) */}
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
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.bankName || !formData.accountNumber || !formData.accountHolder}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Thêm Ngân hàng"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
