"use client";

import React, { useState } from "react";
import { Box, Button, Dialog, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { excelUpProvince } from "@/services/excel.api";
import Spinner from "./SpinnerLoading";
import { generateBillingPeriods } from "@/constants/invoice.constants";
import { isAxiosError } from "axios";
import { IUser } from "@/types/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userData: IUser[];
}

const UploadInvoiceWithProvinceDialog: React.FC<Props> = ({ open, onClose, onSuccess, userData }) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState("");

  const handleUpload = async () => {
    if (!uploadFile) return;
    if (!billingPeriod) {
      toast.error("Vui lòng chọn kỳ hóa đơn!");
      return;
    }

    const selectedUser = userData.find((u) => u._id === selectedUserId);
    const province = selectedUser?.province || "";

    const formData = new FormData();
    formData.append("excelFile", uploadFile);
    formData.append("province", province);
    if (selectedUserId) {
      formData.append("assignedUserId", selectedUserId);
    }
    formData.append("billing_period", billingPeriod);

    setLoading(true);
    try {
      const res = await excelUpProvince(formData);
      if (res?.status === 200) {
        toast.success("Upload file tổng thành công!");
        onSuccess();
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

  const billingPeriods = generateBillingPeriods();

  return (
    <Dialog open={open} onClose={onClose}>
      <Box sx={{ p: 3, minWidth: 320 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Upload Excel + NPT
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="user-label">Người phụ trách (không bắt buộc)</InputLabel>
          <Select
            labelId="user-label"
            value={selectedUserId}
            label="Người phụ trách (không bắt buộc)"
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <MenuItem value="">
              <em>Để trống — ai thu sẽ là người phụ trách</em>
            </MenuItem>
            {userData.map((u) => (
              <MenuItem key={u._id} value={u._id}>
                {u.fullName || u.email}{u.province ? ` — ${u.province}` : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="billing-period-label">Chọn Kỳ</InputLabel>
          <Select
            labelId="billing-period-label"
            value={billingPeriod}
            label="Chọn Kỳ"
            onChange={(e) => setBillingPeriod(e.target.value)}
          >
            {billingPeriods.map((period) => (
              <MenuItem key={period} value={period}>
                {period}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
          Chọn file Excel
          <input type="file" accept=".xls,.xlsx" hidden onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
        </Button>

        {uploadFile && <Typography sx={{ mb: 2 }}>{uploadFile.name}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!uploadFile || !billingPeriod || loading}
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

export default UploadInvoiceWithProvinceDialog;
