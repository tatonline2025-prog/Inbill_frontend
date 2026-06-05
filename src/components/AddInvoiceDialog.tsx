"use client";

import { memo, useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

import { useExpandableBillingPeriods } from "@/hooks/useExpandableBillingPeriods";
import { getDefaultBillingPeriod } from "@/lib/billing-period";
import { normalizeMoneyInputValue, resolveInvoiceAmounts } from "@/lib/money";
import { normalizeRecordBookCode } from "@/lib/record-book-code";
import { createInvoice_API } from "@/services/invoice.api";
import { IUser } from "@/types/user";

const MAX_INVOICES = 10;

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

const createId = () => Math.random().toString(36).slice(2, 11);

const createEmptyInvoice = (): InvoiceItem => ({
  id: createId(),
  invoiceNumber: "",
  customerName: "",
  customerAddress: "",
  currentAmount: "",
  previousAmount: "0",
  totalAmount: "",
  recordBookCode: "",
});

const EXCEL_COLUMN_MAPPING: (keyof InvoiceItem)[] = [
  "invoiceNumber",
  "currentAmount",
  "previousAmount",
  "totalAmount",
  "customerName",
  "customerAddress",
  "recordBookCode",
];

const MONEY_FIELDS: ReadonlySet<keyof InvoiceItem> = new Set(["currentAmount", "previousAmount", "totalAmount"]);

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
          onChange={(event) => onItemChange(inv.id, "invoiceNumber", event.target.value)}
        />
        <TextField
          size="small"
          sx={{ width: 120 }}
          label="Kỳ này"
          value={inv.currentAmount}
          onChange={(event) => onItemChange(inv.id, "currentAmount", event.target.value)}
          inputProps={{ inputMode: "numeric" }}
        />
        <TextField
          size="small"
          sx={{ width: 120 }}
          label="Kỳ trước"
          value={inv.previousAmount}
          onChange={(event) => onItemChange(inv.id, "previousAmount", event.target.value)}
          inputProps={{ inputMode: "numeric" }}
        />
        <TextField
          size="small"
          sx={{ width: 120 }}
          label="Tổng tiền"
          value={inv.totalAmount}
          onChange={(event) => onItemChange(inv.id, "totalAmount", event.target.value)}
          inputProps={{ inputMode: "numeric" }}
        />
        <TextField
          size="small"
          sx={{ width: 200 }}
          label="Tên khách"
          value={inv.customerName}
          onChange={(event) => onItemChange(inv.id, "customerName", event.target.value)}
        />
        <TextField
          size="small"
          sx={{ width: 250 }}
          label="Địa chỉ"
          value={inv.customerAddress}
          onChange={(event) => onItemChange(inv.id, "customerAddress", event.target.value)}
        />
        <TextField
          size="small"
          sx={{ width: 130 }}
          label="Trạm"
          value={inv.recordBookCode}
          onChange={(event) => onItemChange(inv.id, "recordBookCode", event.target.value)}
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
  const [baseBillingPeriod, setBaseBillingPeriod] = useState("");

  const isAdmin = currentUser?.role === "admin";

  const [commonInfo, setCommonInfo] = useState({
    billing_period: "",
    assignedTo: isAdmin ? "" : currentUser?._id || "",
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>([createEmptyInvoice()]);

  const { visiblePeriods, expandPeriods } = useExpandableBillingPeriods({
    basePeriod: baseBillingPeriod,
    resetKey: open,
    selectedPeriod: commonInfo.billing_period,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaultPeriod = getDefaultBillingPeriod();
    setBaseBillingPeriod(defaultPeriod);
    setCommonInfo({
      billing_period: defaultPeriod,
      assignedTo: isAdmin ? "" : currentUser?._id || "",
    });
  }, [currentUser?._id, isAdmin, open]);

  const handleCommonChange = (field: "billing_period" | "assignedTo", value: string) => {
    setCommonInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = useCallback((id: string, field: keyof InvoiceItem, value: string) => {
    const nextValue = MONEY_FIELDS.has(field) ? normalizeMoneyInputValue(value) : value;
    setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? { ...invoice, [field]: nextValue } : invoice)));
  }, []);

  const addNewRow = () => {
    if (invoices.length >= MAX_INVOICES) {
      toast.error(`Chỉ được phép nhập tối đa ${MAX_INVOICES} hóa đơn.`);
      return;
    }

    setInvoices((prev) => [...prev, createEmptyInvoice()]);
  };

  const removeRow = useCallback((id: string) => {
    setInvoices((prev) => (prev.length > 1 ? prev.filter((invoice) => invoice.id !== id) : prev));
  }, []);

  const handleSmartPaste = (event: React.ClipboardEvent) => {
    const clipboardData = event.clipboardData.getData("text");
    if (!clipboardData.includes("\t")) {
      return;
    }

    event.preventDefault();

    const lines = clipboardData
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim() !== "")
      .slice(0, MAX_INVOICES);

    const newRows: InvoiceItem[] = lines.map((line) => {
      const columns = line
        .split("\t")
        .map((column) => column.trim())
        .filter((column) => column !== "");

      const rowData = createEmptyInvoice();

      EXCEL_COLUMN_MAPPING.forEach((field, index) => {
        if (columns[index]) {
          rowData[field] = MONEY_FIELDS.has(field) ? normalizeMoneyInputValue(columns[index]) : columns[index];
        }
      });

      return rowData;
    });

    setInvoices(newRows);
    toast.success(`Đã nhập ${newRows.length} dòng.`);
  };

  const resetDialog = () => {
    setInvoices([createEmptyInvoice()]);
  };

  const handleSubmit = async () => {
    if (!commonInfo.billing_period) {
      toast.error("Vui lòng chọn kỳ hóa đơn.");
      return;
    }

    for (const invoice of invoices) {
      if (!invoice.invoiceNumber.trim()) {
        toast.error("Vui lòng nhập Mã KH.");
        return;
      }
      if (!invoice.customerName.trim()) {
        toast.error("Vui lòng nhập tên khách hàng.");
        return;
      }
      if (!invoice.currentAmount && !invoice.previousAmount && !invoice.totalAmount) {
        toast.error("Vui lòng nhập ít nhất một trong 3 ô Kỳ này, Kỳ trước hoặc Tổng tiền.");
        return;
      }
    }

    try {
      setLoading(true);

      const finalData = invoices.map((invoice) => {
        const resolvedAmounts = resolveInvoiceAmounts({
          currentAmount: invoice.currentAmount,
          previousAmount: invoice.previousAmount,
          totalAmount: invoice.totalAmount,
        });

        return {
          invoiceNumber: invoice.invoiceNumber.trim(),
          customerName: invoice.customerName.trim(),
          customerAddress: invoice.customerAddress.trim(),
          billing_period: commonInfo.billing_period,
          currentAmount: resolvedAmounts.currentAmount,
          previousAmount: resolvedAmounts.previousAmount,
          totalAmount: resolvedAmounts.totalAmount,
          recordBookCode: normalizeRecordBookCode(invoice.recordBookCode),
          assignedTo: commonInfo.assignedTo || "",
        };
      });

      for (const invoiceData of finalData) {
        await createInvoice_API(invoiceData);
      }

      toast.success("Thêm hóa đơn thành công.");
      resetDialog();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);

      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage) {
          toast.error(`Lỗi: ${errorMessage}`);
        } else {
          toast.error("Đã xảy ra lỗi khi thêm hóa đơn. Vui lòng thử lại.");
        }
      } else {
        toast.error("Đã xảy ra lỗi khi thêm hóa đơn. Vui lòng thử lại.");
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
          Thêm 1-10 hóa đơn
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
            <FormControl size="small" sx={{ width: 170 }}>
              <InputLabel id="add-invoice-period-label">Kỳ thanh toán</InputLabel>
              <Select
                labelId="add-invoice-period-label"
                label="Kỳ thanh toán"
                value={commonInfo.billing_period}
                onChange={(event) => handleCommonChange("billing_period", event.target.value)}
              >
                {visiblePeriods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="outlined" onClick={expandPeriods} sx={{ minWidth: 44, px: 0 }}>
              +
            </Button>
          </Box>

          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel>Nhân viên phụ trách</InputLabel>
            <Select
              label="Nhân viên phụ trách"
              value={commonInfo.assignedTo}
              onChange={(event) => handleCommonChange("assignedTo", event.target.value)}
            >
              <MenuItem value="">
                <em>-- Chưa chọn --</em>
              </MenuItem>
              {assignedUsers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogTitle>

      <DialogContent onPaste={handleSmartPaste}>
        <Box sx={{ mt: 2, overflowX: "auto" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: "1300px", mt: 1 }}>
            {invoices.map((invoice, index) => (
              <InvoiceRow
                key={invoice.id}
                inv={invoice}
                index={index}
                onItemChange={handleItemChange}
                onRemove={removeRow}
              />
            ))}
          </Box>

          <Button startIcon={<AddIcon />} onClick={addNewRow} sx={{ mt: 2 }}>
            Thêm dòng mới
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: "1px solid #eee" }}>
        <Typography variant="body2" sx={{ flexGrow: 1, color: "gray" }}>
          Mẹo: có thể copy nhiều dòng từ Excel rồi dán trực tiếp vào vùng nhập.
        </Typography>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Hủy
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang lưu..." : `Lưu ${invoices.length} hóa đơn`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
