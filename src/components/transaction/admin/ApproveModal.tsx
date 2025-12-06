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
  Box,
} from "@mui/material";
import toast from "react-hot-toast";
// Import type ngân hàng (đường dẫn giả định, hãy sửa lại cho đúng project của bạn)
import { ITransactionPaymentBank } from "@/types/transaction";
import { approveTransaction, getBanks } from "@/services/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  transactionId: string | null;
  onSuccess: () => void;
}

export default function ApproveModal({ open, onClose, transactionId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // State cho danh sách ngân hàng và ngân hàng được chọn
  const [banks, setBanks] = useState<ITransactionPaymentBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Load danh sách ngân hàng khi Modal mở
  useEffect(() => {
    if (open) {
      // Reset lại lựa chọn cũ
      setSelectedBankId("");
      setLoadingBanks(true);

      getBanks()
        .then((res) => {
          // Giả sử API trả về { banks: [...] } hoặc res.banks
          if (res?.banks) {
            setBanks(res.banks);
          } else {
            setBanks([]);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Không tải được danh sách ngân hàng thanh toán.");
        })
        .finally(() => {
          setLoadingBanks(false);
        });
    }
  }, [open]);

  const handleApprove = async () => {
    if (!transactionId) return;

    if (!selectedBankId) {
      toast.error("Vui lòng chọn hình thức thanh toán trước khi duyệt.");
      return;
    }

    setLoading(true);
    try {
      // Truyền thêm paymentBankId vào API duyệt
      await approveTransaction(transactionId, selectedBankId);

      toast.success("Đã duyệt và xác nhận thanh toán thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi duyệt giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Duyệt Thanh Toán</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Bạn xác nhận duyệt giao dịch này và đã thực hiện thanh toán?
        </Typography>

        {/* Khung chọn Ngân hàng / Hình thức thanh toán */}
        <Box sx={{ mt: 2 }}>
          <TextField
            select
            label="Chọn hình thức đã thanh toán"
            fullWidth
            required
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            disabled={loading || loadingBanks}
            helperText="Chọn tài khoản công ty đã dùng để chuyển tiền"
          >
            {loadingBanks ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải danh sách...
              </MenuItem>
            ) : banks.length === 0 ? (
              <MenuItem disabled>Chưa cấu hình tài khoản ngân hàng</MenuItem>
            ) : (
              banks.map((bank) => (
                <MenuItem key={bank._id} value={bank._id}>
                  {bank.bankName}
                  {/* Nếu muốn hiện thêm số TK: {bank.bankName} - {bank.accountNumber} */}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleApprove}
          variant="contained"
          color="success"
          disabled={loading || !selectedBankId} // Disable nếu chưa chọn bank
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Xác nhận Duyệt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
