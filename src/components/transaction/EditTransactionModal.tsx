"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Typography,
  InputAdornment,
  Box,
  Divider,
} from "@mui/material";
import toast from "react-hot-toast";
// Giả sử đường dẫn type của bạn
import { ITransaction, ITransactionType } from "@/types/transaction";
import { getTransactionTypes, updateTransaction } from "@/services/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  transaction: ITransaction | null;
  onSuccess: () => void;
}

export default function EditTransactionModal({ open, onClose, transaction, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<ITransactionType[]>([]);

  // State form tách biệt để dễ quản lý
  const [amount, setAmount] = useState<number | string>(0);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [currentDiscount, setCurrentDiscount] = useState<number>(0);

  // 1. Load danh sách loại GD
  useEffect(() => {
    if (open) {
      getTransactionTypes()
        .then((res) => {
          if (res?.data) setTypes(res.data.types); // Hoặc res.data tuỳ cấu trúc API
        })
        .catch((err) => console.error(err));
    }
  }, [open]);

  // 2. Điền dữ liệu cũ vào form
  useEffect(() => {
    if (transaction && open) {
      setAmount(transaction.amount);

      // Xử lý typeId: nó có thể là string ID hoặc là object đã populate
      const tId =
        typeof transaction.typeId === "string"
          ? transaction.typeId
          : (transaction.typeId as ITransactionType)?._id || "";

      setSelectedTypeId(tId);

      // Lấy discount từ object đã populate hoặc set tạm thời (sẽ được cập nhật khi types load xong)
      const tDiscount =
        typeof transaction.typeId === "object" ? (transaction.typeId as ITransactionType).discountPercent : 0;

      setCurrentDiscount(tDiscount);
    }
  }, [transaction, open]);

  // Xử lý khi thay đổi Loại Giao Dịch -> Tự động cập nhật % Chiết khấu
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setSelectedTypeId(newId);

    const foundType = types.find((t) => t._id === newId);

    if (foundType) {
      setCurrentDiscount(foundType.discountPercent);
    }
  };

  // Tính toán real-time
  const numericAmount = Number(amount) || 0;
  const discountAmount = numericAmount * (currentDiscount / 100);

  const finalAmount = numericAmount - discountAmount;

  const handleSubmit = async () => {
    if (!transaction) return;

    setLoading(true);
    try {
      // Gửi dữ liệu cập nhật
      await updateTransaction(transaction._id, {
        amount: numericAmount,
        typeId: selectedTypeId,
      });

      toast.success("Cập nhật giao dịch thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>Chỉnh sửa Giao dịch</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid>
            <TextField
              label="Số tiền giao dịch"
              type="number"
              fullWidth
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
              }}
            />
          </Grid>

          <Grid>
            <TextField
              select
              label="Loại Giao dịch"
              fullWidth
              required
              value={selectedTypeId}
              onChange={handleTypeChange}
            >
              {types.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid>
            <TextField
              label="Chiết khấu áp dụng"
              type="number"
              fullWidth
              value={currentDiscount}
              disabled // KHÔNG CHO SỬA
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
              }}
            />
          </Grid>

          <Grid>
            <Box
              sx={{
                p: 1,
                bgcolor: "primary.50",
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "primary.main",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  Sau chiết khấu:
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {finalAmount.toLocaleString()} VNĐ
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Hủy bỏ
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !amount || !selectedTypeId}>
          {loading ? <CircularProgress size={24} /> : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
