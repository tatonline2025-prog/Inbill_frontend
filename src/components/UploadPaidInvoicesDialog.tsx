"use client";

import React, { useState } from "react";
import { Box, Button, Dialog, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import Spinner from "./SpinnerLoading";
import { generateBillingPeriods } from "@/constants/invoice.constants";
import { handleToggleIsPaidList_API } from "@/services/invoice.api";
import { isAxiosError } from "axios";
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

    // 1. Xử lý text
    const invoiceList = invoiceText
      // Cắt chuỗi bằng regex:
      // \n : Xuống dòng
      // ,  : Dấu phẩy
      // \s : Khoảng trắng (space, tab...)
      // +  : Nếu có nhiều dấu liên tiếp (ví dụ ",   ") thì gom lại cắt 1 lần
      .split(/[\n,\s]+/)
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

      // Giả lập thành công để test UI
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Đã cập nhật thành công ${invoiceList.length} hóa đơn!`);

      // Reset form
      setInvoiceText("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      if (isAxiosError(err)) {
        toast.error(err.response?.data.message || "Có lỗi xảy ra khi cập nhật!");
      } else {
        toast.error("Có lỗi không xác định xảy ra!");
      }
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
