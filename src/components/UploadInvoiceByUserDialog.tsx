"use client";

import React, { useState } from "react";
import { Box, Button, Dialog, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { excelUp } from "@/services/excel.api";
import Spinner from "./SpinnerLoading";
import { generateBillingPeriods } from "@/constants/invoice.constants";
import { isAxiosError } from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assignedUserId: string;
  assignedUserName: string;
}

const UploadInvoiceDialog: React.FC<Props> = ({ open, onClose, onSuccess, assignedUserId, assignedUserName }) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("");

  const handleUpload = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Không thể xác nhận tài khoản. Vui lòng đăng nhập lại");
      return;
    }

    if (!uploadFile) {
      toast.error("Vui lòng chọn file cần upload!");
      return;
    }
    if (!selectedBillingPeriod) {
      toast.error("Vui lòng chọn kỳ hóa đơn!");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", uploadFile);
    formData.append("userId", assignedUserId);
    formData.append("billing_period", selectedBillingPeriod);

    setLoading(true);
    try {
      const res = await excelUp(formData, token);

      if (res?.status === 200) {
        toast.success("Upload file thành công!");
        onSuccess?.();
        onClose();
      } else {
        toast.error("Upload thất bại!");
      }
    } catch (err) {
      console.error(err);
      // Hiển thị lỗi chi tiết từ backend cho người dùng
      if (isAxiosError(err)) {
        const errorMessage = err.response?.data?.message;
        if (errorMessage) {
          toast.error(`Lỗi: ${errorMessage}`);
        } else {
          toast.error("Có lỗi xảy ra khi upload! Vui lòng thử lại.");
        }
      } else {
        toast.error("Có lỗi xảy ra khi upload! Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Box sx={{ p: 3, minWidth: 300 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Upload Excel
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
          Nguoi phu trach: <b>{assignedUserName}</b>
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="billing-period-label">Chon Ky</InputLabel>
          <Select
            labelId="billing-period-label"
            value={selectedBillingPeriod}
            label="Chon Ky"
            onChange={(e) => setSelectedBillingPeriod(e.target.value)}
          >
            <MenuItem value="">-- Chon Ky --</MenuItem>
            {generateBillingPeriods().map((period) => (
              <MenuItem key={period} value={period}>
                {period}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
          Chon file Excel
          <input type="file" accept=".xls,.xlsx" hidden onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
        </Button>

        {uploadFile && <Typography sx={{ mb: 2 }}>{uploadFile.name}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Huy
          </Button>
          <Button
            variant="contained"
            disabled={!uploadFile || !selectedBillingPeriod || loading}
            onClick={handleUpload}
            startIcon={loading ? <Spinner size={20} /> : null}
          >
            {loading ? "Đang upload..." : "Upload"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default UploadInvoiceDialog;
