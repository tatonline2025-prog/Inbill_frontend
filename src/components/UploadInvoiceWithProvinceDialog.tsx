"use client";

import { useEffect, useState } from "react";
import { Box, Button, Dialog, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

import { excelUpProvince } from "@/services/excel.api";
import { useExpandableBillingPeriods } from "@/hooks/useExpandableBillingPeriods";
import { getCurrentBillingPeriod, normalizeBillingPeriod, sortBillingPeriodsDesc } from "@/lib/billing-period";
import { fetchBillingPeriods_API, fetchLatestPeriod_API } from "@/services/invoice.api";
import { IUser } from "@/types/user";
import { formatAreaPrefixLabel, getPrimaryAreaPrefix } from "@/lib/area-prefix";
import Spinner from "./SpinnerLoading";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userData: IUser[];
}

const UploadInvoiceWithProvinceDialog = ({ open, onClose, onSuccess, userData }: Props) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [baseBillingPeriod, setBaseBillingPeriod] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("");

  const { visiblePeriods, expandPeriods } = useExpandableBillingPeriods({
    basePeriod: baseBillingPeriod,
    resetKey: open,
    selectedPeriod: billingPeriod,
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
        const sortedBillingPeriods = sortBillingPeriodsDesc(billingPeriodsResponse?.periods || []);
        const nextPeriod =
          sortedBillingPeriods[0] ||
          normalizeBillingPeriod(latestPeriodResponse?.billing_period) ||
          getCurrentBillingPeriod();

        if (!isActive) {
          return;
        }

        setBaseBillingPeriod(nextPeriod);
        setBillingPeriod(nextPeriod);
      } catch (error) {
        console.error(error);

        if (!isActive) {
          return;
        }

        const fallbackPeriod = getCurrentBillingPeriod();
        setBaseBillingPeriod(fallbackPeriod);
        setBillingPeriod(fallbackPeriod);
      }
    };

    loadDefaultBillingPeriod();

    return () => {
      isActive = false;
    };
  }, [open]);

  const handleDialogClose = () => {
    setSelectedUserId("");
    setUploadFile(null);
    setBillingPeriod("");
    onClose();
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      return;
    }

    if (!billingPeriod) {
      toast.error("Vui lòng chọn kỳ hóa đơn.");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", uploadFile);
    if (selectedUserId) {
      formData.append("assignedUserId", selectedUserId);
    }
    formData.append("billing_period", billingPeriod);

    setLoading(true);
    try {
      const response = await excelUpProvince(formData);
      if (response?.status === 200) {
        toast.success(response.data?.message || "Tải file tổng lên thành công.");
        onSuccess();
        handleDialogClose();
      } else {
        toast.error("Tải file lên thất bại.");
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
          Tải Excel + người phụ trách
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Nếu file có cột <b>NPT/CTV</b>, <b>NPT</b> hoặc <b>CTV</b> thì hệ thống sẽ gán người phụ trách theo từng dòng.
          Mục chọn bên dưới chỉ dùng làm mặc định cho dòng trống.
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="user-label">Người phụ trách (không bắt buộc)</InputLabel>
          <Select
            labelId="user-label"
            value={selectedUserId}
            label="Người phụ trách (không bắt buộc)"
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            <MenuItem value="">
              <em>Để trống, ai thu sẽ là người phụ trách</em>
            </MenuItem>
            {userData.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.fullName || user.email}
                {` - ${formatAreaPrefixLabel(getPrimaryAreaPrefix(user))}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", gap: 1, alignItems: "stretch", mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="billing-period-label">Chọn kỳ</InputLabel>
            <Select
              labelId="billing-period-label"
              value={billingPeriod}
              label="Chọn kỳ"
              onChange={(event) => setBillingPeriod(event.target.value)}
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
            disabled={!uploadFile || !billingPeriod || loading}
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

export default UploadInvoiceWithProvinceDialog;
