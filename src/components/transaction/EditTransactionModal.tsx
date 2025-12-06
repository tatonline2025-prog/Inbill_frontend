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
  const [loadingTypes, setLoadingTypes] = useState(true);

  // State form tách biệt
  const [amount, setAmount] = useState<number | string>(0);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  // Dữ liệu mới: Chiết khấu của giao dịch (được CTV tự điền/sửa)
  const [discountPercent, setDiscountPercent] = useState<number | string>(0);

  // 1. Load danh sách loại GD
  useEffect(() => {
    if (open) {
      setLoadingTypes(true);
      getTransactionTypes()
        .then((res) => {
          if (res?.data) setTypes(res.data.types);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingTypes(false));
    }
  }, [open]);

  // 2. Điền dữ liệu cũ vào form và state khi transaction/modal thay đổi
  useEffect(() => {
    if (transaction && open) {
      setAmount(transaction.amount);

      // Lấy Chiết khấu hiện tại của Giao dịch
      setDiscountPercent(transaction.discountPercent || 0);

      // Xử lý typeId: nó có thể là string ID hoặc là object đã populate
      const tId =
        typeof transaction.typeId === "string"
          ? transaction.typeId
          : (transaction.typeId as ITransactionType)?._id || "";

      setSelectedTypeId(tId);
    }
  }, [transaction, open]);

  // Xử lý khi thay đổi Loại Giao Dịch
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTypeId(e.target.value);

    // Lưu ý: Không cần tự động cập nhật discountPercent theo typeId nữa,
    // vì discountPercent là do CTV tự điền/sửa trực tiếp trên giao dịch.
  };

  // Tính toán real-time
  const numericAmount = Number(amount) || 0;
  const numericDiscount = Number(discountPercent) || 0; // Lấy discount từ state mới

  const discountAmount = numericAmount * (numericDiscount / 100);
  const finalAmount = numericAmount - discountAmount;

  const handleSubmit = async () => {
    if (!transaction) return;

    if (numericAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0.");
      return;
    }
    if (numericDiscount < 0 || numericDiscount > 100) {
      toast.error("Chiết khấu phải từ 0% đến 100%.");
      return;
    }

    setLoading(true);
    try {
      // Gửi dữ liệu cập nhật, BAO GỒM discountPercent
      await updateTransaction(transaction._id, {
        amount: numericAmount,
        typeId: selectedTypeId,
        discountPercent: numericDiscount, // <-- Đã truyền discountPercent mới
      });

      toast.success("Cập nhật giao dịch thành công! 🎉");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !amount || !selectedTypeId || numericAmount <= 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>Chỉnh sửa Báo Cáo Giao Dịch</DialogTitle>

      {/* Hiển thị thông báo trạng thái PENDING */}
      {transaction?.status !== "PENDING" && (
        <Box sx={{ bgcolor: "error.main", color: "white", p: 1, textAlign: "center" }}>
          <Typography variant="body2">
            Giao dịch đã được **{transaction?.status === "APPROVED" ? "DUYỆT VÀ THANH TOÁN" : "TỪ CHỐI"}.** Bạn không
            thể chỉnh sửa.
          </Typography>
        </Box>
      )}

      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {/* Loại Giao dịch */}
          <Grid>
            <TextField
              select
              label="Loại Giao dịch"
              fullWidth
              required
              value={selectedTypeId}
              onChange={handleTypeChange}
              disabled={loadingTypes || transaction?.status !== "PENDING"} // Disable nếu đã duyệt
            >
              {loadingTypes ? (
                <MenuItem disabled>Đang tải...</MenuItem>
              ) : (
                types.map((t) => (
                  <MenuItem key={t._id} value={t._id}>
                    {t.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>

          {/* Số tiền giao dịch */}
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
                inputProps: { min: 0 },
              }}
              disabled={transaction?.status !== "PENDING"} // Disable nếu đã duyệt
            />
          </Grid>

          {/* Chiết khấu áp dụng */}
          <Grid>
            <TextField
              label="% Chiết khấu"
              type="number"
              fullWidth
              required
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { min: 0, max: 100 },
              }}
              disabled={transaction?.status !== "PENDING"} // Disable nếu đã duyệt
            />
          </Grid>

          {/* Khối hiển thị kết quả */}
          <Grid>
            <Box
              sx={{
                p: 1,
                bgcolor: "primary.main", // Màu nền nổi bật
                borderRadius: 2,
                color: "white",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Sau chiết khấu:
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {finalAmount.toLocaleString("vi-VN")} VNĐ
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
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitDisabled || transaction?.status !== "PENDING"} // Vô hiệu hóa nếu không phải PENDING
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Lưu thay đổi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
