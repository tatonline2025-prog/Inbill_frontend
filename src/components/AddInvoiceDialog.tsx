"use client";

import { memo, useCallback, useEffect, useState } from "react";
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
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { createInvoice_API, fetchLatestPeriod_API } from "@/services/invoice.api";
import toast from "react-hot-toast";
import { generateBillingPeriods } from "@/constants/invoice.constants";
import { isAxiosError } from "axios";
import { IUser } from "@/types/user";

const MAX_INVOICES = 10;

// Định nghĩa kiểu dữ liệu cho từng dòng hóa đơn
interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  currentAmount: string;
  previousAmount: string;
  recordBookCode: string;
  totalAmount: string;
}

const InvoiceRow = memo(
  ({
    inv,
    index,
    onItemChange,
    onRemove,
  }: {
    inv: InvoiceItem;
    index: number;
    onItemChange: (id: string, field: keyof InvoiceItem, value: string) => void;
    onRemove: (id: string) => void;
  }) => {
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          bgcolor: index % 2 === 0 ? "#fcfcfc" : "#fff",
          p: 0.5,
          borderRadius: 1,
        }}
      >
        <TextField
          size="small"
          sx={{ width: 150 }}
          label="Mã KH"
          value={inv.invoiceNumber}
          onChange={(e) => onItemChange(inv.id, "invoiceNumber", e.target.value)}
        />
        <TextField
          size="small"
          type="number"
          sx={{ width: 120 }}
          label="Kỳ này"
          value={inv.currentAmount}
          onChange={(e) => onItemChange(inv.id, "currentAmount", e.target.value)}
        />
        <TextField
          size="small"
          type="number"
          sx={{ width: 120 }}
          label="Kỳ trước"
          value={inv.previousAmount}
          onChange={(e) => onItemChange(inv.id, "previousAmount", e.target.value)}
        />
        <TextField
          size="small"
          type="number"
          sx={{ width: 120 }}
          label="Tổng tiền"
          value={inv.totalAmount}
          onChange={(e) => onItemChange(inv.id, "totalAmount", e.target.value)}
        />
        <TextField
          size="small"
          sx={{ width: 200 }}
          label="Tên khách"
          value={inv.customerName}
          onChange={(e) => onItemChange(inv.id, "customerName", e.target.value)}
        />
        <TextField
          size="small"
          sx={{ width: 250 }}
          label="Địa chỉ"
          value={inv.customerAddress}
          onChange={(e) => onItemChange(inv.id, "customerAddress", e.target.value)}
        />
        <TextField
          size="small"
          sx={{ width: 130 }}
          label="Trạm"
          value={inv.recordBookCode}
          onChange={(e) => onItemChange(inv.id, "recordBookCode", e.target.value)}
        />
        <IconButton color="error" onClick={() => onRemove(inv.id)} size="small">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }
);

InvoiceRow.displayName = "InvoiceRow";

export default function AddInvoiceDialog({
  open,
  onClose,
  onSuccess,
  assignedUsers = [],
  currentUser,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignedUsers?: { _id: string; fullName: string }[];
  currentUser?: IUser | null;
}) {
  const [loading, setLoading] = useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin";

  const [commonInfo, setCommonInfo] = useState({
    billing_period: "",
    assignedTo: isAdmin ? "" : (currentUser?._id || ""),
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: "",
      invoiceNumber: "",
      customerName: "",
      customerAddress: "",
      currentAmount: "",
      previousAmount: "0",
      totalAmount: "",
      recordBookCode: "",
    },
  ]);

  const EXCEL_COLUMN_MAPPING: (keyof InvoiceItem)[] = [
    "invoiceNumber",
    "currentAmount",
    "previousAmount",
    "totalAmount",
    "customerName",
    "customerAddress",
    "recordBookCode",
  ];

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetchLatestPeriod_API();
        if (res.billing_period) setCommonInfo((prev) => ({ ...prev, billing_period: res.billing_period }));
      } catch (error) {
        console.error(error);
      }
    };
    if (open) fetchLatest();
  }, [open]);

  const handleCommonChange = (field: string, value: string) => {
    setCommonInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = useCallback((id: string, field: keyof InvoiceItem, value: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv)));
  }, []);

  const addNewRow = () => {
    if (invoices.length >= MAX_INVOICES) {
      toast.error(`Chỉ được phép nhập tối đa ${MAX_INVOICES} hóa đơn!`);
      return;
    }
    setInvoices((prev) => [
      ...prev,
      {
        id: generateId(),
        invoiceNumber: "",
        customerName: "",
        customerAddress: "",
        currentAmount: "",
        previousAmount: "0",
        totalAmount: "",
        recordBookCode: "",
      },
    ]);
  };

  const removeRow = useCallback((id: string) => {
    setInvoices((prev) => (prev.length > 1 ? prev.filter((inv) => inv.id !== id) : prev));
  }, []);

  const handleSmartPaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData.getData("text");
    if (!clipboardData.includes("\t")) return;

    e.preventDefault();
    const lines = clipboardData
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim() !== "")
      .slice(0, MAX_INVOICES);

    const newRows: InvoiceItem[] = lines.map((line) => {
      const columns = line
        .split("\t")
        .map((col) => col.trim())
        .filter((col) => col !== "");
      const rowData: InvoiceItem = {
        id: generateId(),
        invoiceNumber: "",
        customerName: "",
        customerAddress: "",
        currentAmount: "",
        previousAmount: "0",
        totalAmount: "",
        recordBookCode: "",
      };

      EXCEL_COLUMN_MAPPING.forEach((field, idx) => {
        if (columns[idx]) rowData[field] = columns[idx];
      });
      return rowData;
    });

    setInvoices(newRows);
    toast.success(`Đã nhập ${newRows.length} dòng!`);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!commonInfo.billing_period) return toast.error("Vui lòng chọn Kỳ hóa đơn!");
    
    // Validate each invoice has required fields
    for (const invoice of invoices) {
      if (!invoice.invoiceNumber?.trim()) {
        return toast.error("Vui lòng nhập Mã khách hàng!");
      }
      if (!invoice.customerName?.trim()) {
        return toast.error("Vui lòng nhập Tên khách hàng!");
      }
      if (!invoice.currentAmount || invoice.currentAmount === "") {
        return toast.error("Vui lòng nhập Số tiền kỳ này!");
      }
    }

    try {
      setLoading(true);
      const finalData = invoices.map((invoice) => {
        // Calculate totalAmount if not provided
        const currentAmount = invoice.currentAmount || "0";
        const previousAmount = invoice.previousAmount || "0";
        const totalAmount = invoice.totalAmount || 
          (Number(currentAmount) + Number(previousAmount)).toString();
        
        const payload = {
          invoiceNumber: invoice.invoiceNumber?.trim() || "",
          customerName: invoice.customerName?.trim() || "",
          customerAddress: invoice.customerAddress?.trim() || "",
          billing_period: commonInfo.billing_period,
          currentAmount: currentAmount,
          previousAmount: previousAmount,
          totalAmount: totalAmount,
          recordBookCode: invoice.recordBookCode?.trim() || "",
          assignedTo: commonInfo.assignedTo || "",
        };
        return payload;
      });
      
      for (const data of finalData) {
        await createInvoice_API(data);
      }
      toast.success("Thành công!");
      onSuccess();
      onClose();
      setInvoices([
        {
          id: generateId(),
          invoiceNumber: "",
          customerName: "",
          customerAddress: "",
          currentAmount: "",
          previousAmount: "0",
          totalAmount: "",
          recordBookCode: "",
        },
      ]);
    } catch (error) {
      console.error(error);
      // Hiển thị lỗi chi tiết từ backend cho người dùng
      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage) {
          toast.error(`Lỗi: ${errorMessage}`);
        } else {
          toast.error("Đã xảy ra lỗi khi thêm hóa đơn. Vui lòng thử lại!");
        }
      } else {
        toast.error("Đã xảy ra lỗi khi thêm hóa đơn. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle
        component="div"
        sx={{ borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6" fontWeight="bold">
          Thêm 1-10 hoá đơn
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            select
            label="Kỳ TT"
            value={commonInfo.billing_period}
            onChange={(e) => handleCommonChange("billing_period", e.target.value)}
            size="small"
            sx={{ width: 150 }}
          >
            {generateBillingPeriods().map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>

          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel>Nhân viên phụ trách</InputLabel>
            <Select
              label="Nhân viên phụ trách"
              value={commonInfo.assignedTo}
              onChange={(e) => handleCommonChange("assignedTo", e.target.value)}
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
        </Box>
      </DialogTitle>

      <DialogContent onPaste={handleSmartPaste}>
        <Box sx={{ mt: 2, overflowX: "auto" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: "1300px", mt: 1 }}>
            {invoices.map((inv, index) => (
              <InvoiceRow key={inv.id} inv={inv} index={index} onItemChange={handleItemChange} onRemove={removeRow} />
            ))}
          </Box>

          <Button startIcon={<AddIcon />} onClick={addNewRow} sx={{ mt: 2 }}>
            Thêm dòng mới
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: "1px solid #eee" }}>
        <Typography variant="body2" sx={{ flexGrow: 1, color: "gray" }}>
          Mẹo: Bạn có thể copy nhiều dòng từ Excel và dán vào ô Mã KH.
        </Typography>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Hủy bỏ
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang lưu..." : `Lưu ${invoices.length} hóa đơn`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
