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
  const [discountRate, setDiscountRate] = useState<string>(""); // Để string để dễ xử lý input rỗng
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [banks, setBanks] = useState<ITransactionPaymentBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedBankId("");
      getBanks()
        .then((res) => {
          if (res?.banks) {
            // Giả định response là { banks: [...] }
            setBanks(res.banks);
            // Có thể set default bank nếu cần
          }
        })
        .catch((err) => toast.error("Lỗi tải danh sách ngân hàng."));
    }
  }, [open]);

  const handleSubmit = async () => {
    // Validate cơ bản
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên loại giao dịch");
      return;
    }

    const rate = parseFloat(discountRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Chiết khấu phải là số từ 0 đến 100");
      return;
    }

    setLoading(true);
    try {
      await createTransactionType(name, rate, description, selectedBankId);

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
    setDiscountRate("");
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
          label="Chiết khấu mặc định"
          type="number"
          fullWidth
          required
          value={discountRate}
          onChange={(e) => setDiscountRate(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
            inputProps: { min: 0, max: 100, step: "0.1" },
          }}
          placeholder="Nhập số % (VD: 5.5)"
          helperText="Số % này sẽ tự động áp dụng khi CTV chọn loại giao dịch này"
          sx={{ mb: 2 }}
        />

        <TextField
          select
          margin="dense"
          label="Tài khoản nhận tiền CTV chuyển"
          fullWidth
          required
          value={selectedBankId}
          onChange={(e) => setSelectedBankId(e.target.value)}
          helperText="Chọn tài khoản Admin nhận tiền từ CTV cho loại giao dịch này."
          sx={{ mb: 2 }}
        >
          {banks.length === 0 ? (
            <MenuItem disabled value="">
              {/* Có thể thay bằng CircularProgress nếu thích */}
              Chưa có tài khoản ngân hàng nào.
            </MenuItem>
          ) : (
            banks.map((bank) => (
              <MenuItem key={bank._id} value={bank._id}>
                {`${bank.bankName} - ${bank.accountNumber} (${bank.accountHolder})`}
              </MenuItem>
            ))
          )}
        </TextField>

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
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name || discountRate === "" || selectedBankId === ""}
        >
          {loading ? <CircularProgress size={20} /> : "Tạo mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
