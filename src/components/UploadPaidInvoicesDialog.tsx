"use client";

import React, { useState } from "react";
import { Box, Button, Dialog, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import Spinner from "./SpinnerLoading";
import { generateBillingPeriods } from "@/constants/invoice.constants";
import { handleToggleIsPaidList_API } from "@/services/invoice.api";
// Import API mới của bạn ở đây (ví dụ: updatePaidInvoices)
// import { updatePaidInvoices } from "@/services/invoice.api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UploadPaidInvoicesDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [invoiceText, setInvoiceText] = useState(""); // State lưu chuỗi text nhập vào
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!invoiceText.trim()) {
      toast.error("Vui lòng nhập danh sách hóa đơn!");
      return;
    }

    // 1. Xử lý text: Tách dòng (\n), xóa khoảng trắng thừa, loại bỏ dòng trống
    const invoiceList = invoiceText
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    if (invoiceList.length === 0) {
      toast.error("Danh sách hóa đơn trống!");
      return;
    }

    // 2. Chuẩn bị payload gửi đi
    const payload = {
      invoiceNumbers: invoiceList, // Gửi mảng danh sách string
    };

    setLoading(true);
    try {
      // 3. Gọi API (Thay thế hàm này bằng API thực tế của bạn)
      const res = await handleToggleIsPaidList_API(payload);

      console.log(res);

      // if (res?.status === 200) { ... }

      // Giả lập thành công để test UI
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Đã cập nhật thành công ${invoiceList.length} hóa đơn!`);

      // Reset form
      setInvoiceText("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Cập nhật Hóa đơn đã đóng cước
        </Typography>

        {/* Text Area nhập danh sách */}
        <TextField
          label="Danh sách Mã Hóa Đơn"
          multiline
          rows={8}
          placeholder={`Paste danh sách mã hóa đơn vào đây.\nVí dụ:\nPB071...\nPB072...\nPB073...`}
          value={invoiceText}
          onChange={(e) => setInvoiceText(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
          helperText={`Đã nhập: ${invoiceText.split("\n").filter((i) => i.trim()).length} dòng`}
        />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="secondary" // Màu secondary cho khác biệt với upload file
            disabled={!invoiceText.trim()}
            onClick={handleSubmit}
            startIcon={loading ? <Spinner size={20} /> : null}
          >
            {loading ? "Đang xử lý..." : "Cập nhật"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default UploadPaidInvoicesDialog;
