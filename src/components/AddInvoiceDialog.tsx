"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Box,
} from "@mui/material";
import { createInvoice_API, fetchLatestPeriod_API } from "@/services/invoice.api";
import axios from "axios";
import toast from "react-hot-toast";

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  billing_period: string;
  currentAmount: string;
  previousAmount: string;
  recordBookCode: string;
  totalAmount: string;
  assignedTo: string;
}

export default function AddInvoiceDialog({
  open,
  onClose,
  onSuccess,
  assignedUsers = [],
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignedUsers?: { _id: string; fullName: string }[];
}) {
  const [billingPeriod, setBillingPeriod] = useState("");
  const [loading, setLoading] = useState(false);

  const DEFAULT_INVOICE = {
    invoiceNumber: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    billing_period: "",
    currentAmount: "",
    previousAmount: "0",
    totalAmount: "",
    recordBookCode: "",
    assignedTo: "",
  };

  const EXCEL_COLUMN_MAPPING = [
    "invoiceNumber",
    "customerName",
    "customerAddress",
    "currentAmount",
    "previousAmount",
    "totalAmount",
    "recordBookCode",
  ];

  const [newInvoice, setNewInvoice] = useState<InvoiceData>(DEFAULT_INVOICE);

  useEffect(() => {
    const fetchLatestPeriod = async () => {
      try {
        const res = await fetchLatestPeriod_API();
        if (res.billing_period) {
          setBillingPeriod(res.billing_period);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchLatestPeriod();
  }, []);

  useEffect(() => {
    if (open) {
      setNewInvoice((prev) => ({
        ...prev,
        billing_period: billingPeriod || "",
      }));
    }
  }, [open, billingPeriod]);

  const handleChange = (field: string, value: string) => {
    setNewInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !newInvoice.invoiceNumber ||
      !newInvoice.customerName ||
      !newInvoice.billing_period ||
      !newInvoice.previousAmount ||
      !newInvoice.currentAmount
    ) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      setLoading(true);
      await createInvoice_API(newInvoice);

      setNewInvoice({
        ...DEFAULT_INVOICE,
        billing_period: billingPeriod || "",
      });

      onSuccess();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Lỗi khi tạo hoá đơn:", error.response?.data.message);
        alert(error.response?.data.message);
      } else {
        console.error("Lỗi không xác định:", error);
        alert("Lỗi không xác định");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSmartPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData.getData("text");

    // Kiểm tra xem có dấu tab (\t) không (Dấu hiệu của copy từ Excel)
    if (clipboardData.includes("\t")) {
      e.preventDefault();

      const lines = clipboardData.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");

      if (lines.length === 0) return;

      const firstLine = lines[0];
      const columns = firstLine.split("\t");

      const validCols = columns
        .map((c) => c.trim()) // Xóa khoảng trắng thừa đầu đuôi
        .filter((c) => c !== "");

      const updatedInvoice: InvoiceData = { ...newInvoice };
      let hasChange = false;

      validCols.forEach((colValue, index) => {
        if (index < EXCEL_COLUMN_MAPPING.length) {
          const fieldName = EXCEL_COLUMN_MAPPING[index] as keyof InvoiceData;

          const cleanValue = colValue.trim();

          updatedInvoice[fieldName] = cleanValue;
          hasChange = true;
        }
      });

      if (hasChange) {
        setNewInvoice(updatedInvoice);

        toast.success(`Đã dán dữ liệu!`);
      }
    }
  };

  return (
    // 1. Tăng chiều rộng Dialog lên 'lg' để chứa được nhiều cột
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ borderBottom: "1px solid #eee", mb: 2 }}>Thêm mới hóa đơn</DialogTitle>

      <DialogContent sx={{ overflowY: "visible" }}>
        <Box sx={{ overflowX: "auto", pb: 1, pt: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ minWidth: "1200px" }} onPaste={handleSmartPaste}>
            <Box sx={{ width: "120px", flexShrink: 0 }}>
              <TextField
                label="Mã KH"
                value={newInvoice.invoiceNumber}
                onChange={(e) => handleChange("invoiceNumber", e.target.value)}
                fullWidth
                required
                size="small"
                placeholder="PB..."
              />
            </Box>

            <Box sx={{ width: "200px", flexShrink: 0 }}>
              <TextField
                label="Tên khách hàng"
                value={newInvoice.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                fullWidth
                required
                size="small"
              />
            </Box>

            <Box sx={{ width: "200px", flexShrink: 0 }}>
              <TextField
                label="Địa chỉ chi tiết"
                value={newInvoice.customerAddress}
                onChange={(e) => handleChange("customerAddress", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <Box sx={{ width: "120px", flexShrink: 0 }}>
              <TextField
                label="Nợ kỳ này"
                type="number"
                value={newInvoice.currentAmount}
                onChange={(e) => handleChange("currentAmount", e.target.value)}
                fullWidth
                required
                size="small"
              />
            </Box>

            <Box sx={{ width: "120px", flexShrink: 0 }}>
              <TextField
                label="Nợ kỳ trước"
                type="number"
                value={newInvoice.previousAmount}
                onChange={(e) => handleChange("previousAmount", e.target.value)}
                fullWidth
                required
                size="small"
              />
            </Box>

            <Box sx={{ width: "120px", flexShrink: 0 }}>
              <TextField
                label="Tổng tiền"
                type="number"
                value={newInvoice.totalAmount}
                onChange={(e) => handleChange("totalAmount", e.target.value)}
                fullWidth
                required
                size="small"
              />
            </Box>

            <Box sx={{ width: "120px", flexShrink: 0 }}>
              <TextField
                label="Trạm"
                value={newInvoice.recordBookCode}
                onChange={(e) => handleChange("recordBookCode", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <Box sx={{ width: "110px", flexShrink: 0 }}>
              <TextField
                label="Tháng nợ"
                value={newInvoice.billing_period}
                onChange={(e) => handleChange("billing_period", e.target.value)}
                fullWidth
                required
                size="small"
                placeholder="10/2025"
              />
            </Box>

            <Box sx={{ width: "180px", flexShrink: 0 }}>
              {assignedUsers?.length > 0 && (
                <FormControl fullWidth size="small">
                  <InputLabel id="assigned-user-label">Nhân viên</InputLabel>
                  <Select
                    labelId="assigned-user-label"
                    label="Nhân viên"
                    value={newInvoice.assignedTo}
                    onChange={(e) => handleChange("assignedTo", e.target.value as string)}
                  >
                    <MenuItem value="">
                      <em>-- Trống --</em>
                    </MenuItem>
                    {assignedUsers.map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        {u.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: "1px solid #eee" }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Hủy bỏ
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu hóa đơn"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
