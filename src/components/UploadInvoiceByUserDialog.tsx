"use client";

import { useEffect, useState } from "react";
import { Box, Button, Dialog, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

import { excelUp } from "@/services/excel.api";
import { useExpandableBillingPeriods } from "@/hooks/useExpandableBillingPeriods";
import { getCurrentBillingPeriod, normalizeBillingPeriod, sortBillingPeriodsAsc } from "@/lib/billing-period";
import { fetchBillingPeriods_API, fetchLatestPeriod_API } from "@/services/invoice.api";
import Spinner from "./SpinnerLoading";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  assignedUserId: string;
  assignedUserName: string;
}

const UploadInvoiceDialog = ({ open, onClose, onSuccess, assignedUserId, assignedUserName }: Props) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [baseBillingPeriod, setBaseBillingPeriod] = useState("");
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("");

  const { visiblePeriods, expandPeriods } = useExpandableBillingPeriods({
    basePeriod: baseBillingPeriod,
    resetKey: open,
    selectedPeriod: selectedBillingPeriod,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    const loadDefaultBillingPeriod = async () => {
      try {
        const [billingPeriodsResponse, latestPeriodResponse] = await Promise.all([
          fetchBillingPeriods_API().catch(() => null),
          fetchLatestPeriod_API().catch(() => null),
        ]);
        const sortedBillingPeriods = sortBillingPeriodsAsc(billingPeriodsResponse?.periods || []);
        const nextPeriod =
          sortedBillingPeriods[0] ||
          normalizeBillingPeriod(latestPeriodResponse?.billing_period) ||
          getCurrentBillingPeriod();

        if (!isActive) {
          return;
        }

        setBaseBillingPeriod(nextPeriod);
        setSelectedBillingPeriod(nextPeriod);
      } catch (error) {
        console.error(error);

        if (!isActive) {
          return;
        }

        const fallbackPeriod = getCurrentBillingPeriod();
        setBaseBillingPeriod(fallbackPeriod);
        setSelectedBillingPeriod(fallbackPeriod);
      }
    };

    loadDefaultBillingPeriod();

    return () => {
      isActive = false;
    };
  }, [open]);

  const handleDialogClose = () => {
    setUploadFile(null);
    setSelectedBillingPeriod("");
    onClose();
  };

  const handleUpload = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Không thể xác nhận tài khoản. Vui lòng đăng nhập lại.");
      return;
    }

    if (!uploadFile) {
      toast.error("Vui lòng chọn file cần upload.");
      return;
    }

    if (!selectedBillingPeriod) {
      toast.error("Vui lòng chọn kỳ hóa đơn.");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", uploadFile);
    formData.append("userId", assignedUserId);
    formData.append("billing_period", selectedBillingPeriod);

    setLoading(true);
    try {
      const response = await excelUp(formData, token);

      if (response?.status === 200) {
        toast.success("Upload file thành công.");
        onSuccess?.();
        handleDialogClose();
      } else {
        toast.error("Upload thất bại.");
      }
    } catch (error) {
      console.error(error);

      if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message;
        if (errorMessage) {
          toast.error(`Lỗi: ${errorMessage}`);
        } else {
          toast.error("Có lỗi xảy ra khi upload. Vui lòng thử lại.");
        }
      } else {
        toast.error("Có lỗi xảy ra khi upload. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose}>
      <Box sx={{ p: 3, minWidth: 320 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tải Excel
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
          Người phụ trách: <b>{assignedUserName}</b>
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "stretch", mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="billing-period-label">Chọn kỳ</InputLabel>
            <Select
              labelId="billing-period-label"
              value={selectedBillingPeriod}
              label="Chọn kỳ"
              onChange={(event) => setSelectedBillingPeriod(event.target.value)}
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

        <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
          Chọn file Excel
          <input type="file" accept=".xls,.xlsx" hidden onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
        </Button>

        {uploadFile && <Typography sx={{ mb: 2 }}>{uploadFile.name}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={handleDialogClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!uploadFile || !selectedBillingPeriod || loading}
            onClick={handleUpload}
            startIcon={loading ? <Spinner size={20} /> : null}
          >
            {loading ? "Đang tải lên..." : "Tải lên"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default UploadInvoiceDialog;
