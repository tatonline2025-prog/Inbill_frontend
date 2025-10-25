"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { fetchallInvoice } from "@/services/invoice.api";
import { InvoiceInfo } from "@/types/invoice";
import { excelUpProvince } from "@/services/excel.api";
import Spinner from "./SpinnerLoading";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: InvoiceInfo[]) => void;
}

const UploadInvoiceWithProvinceDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!uploadFile || !selectedProvince) return;

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("province", selectedProvince);

    setLoading(true);
    try {
      const res = await excelUpProvince(formData);
      console.log(res);

      if (res?.status === 200) {
        toast.success("Upload file tổng thành công!");
        onClose();
      } else {
        toast.error("Upload thất bại!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi upload!");
    } finally {
      setLoading(false);
    }
  };

  const provinces = [
    "TP Hà Nội",
    "TP Huế",
    "Quảng Ninh",
    "Cao Bằng",
    "Lạng Sơn",
    "Lai Châu",
    "Điện Biên",
    "Sơn La",
    "Thanh Hóa",
    "Nghệ An",
    "Hà Tĩnh",
    "Tuyên Quang",
    "Lào Cai",
    "Thái Nguyên",
    "Phú Thọ",
    "Bắc Ninh",
    "Hưng Yên",
    "TP Hải Phòng",
    "Ninh Bình",
    "Quảng Trị",
    "TP Đà Nẵng",
    "Quảng Ngãi",
    "Gia Lai",
    "Khánh Hòa",
    "Lâm Đồng",
    "Đắk Lắk",
    "TP Hồ Chí Minh",
    "Đồng Nai",
    "Tây Ninh",
    "TP Cần Thơ",
    "Vĩnh Long",
    "Đồng Tháp",
    "Cà Mau",
    "An Giang",
  ];

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <Box sx={{ p: 3, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Upload Excel với tỉnh
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="province-label">Chọn tỉnh</InputLabel>
            <Select
              labelId="province-label"
              value={selectedProvince}
              label="Chọn tỉnh"
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              {provinces.map((prov) => (
                <MenuItem key={prov} value={prov}>
                  {prov}
                </MenuItem>
              ))}
              {/* Add các tỉnh khác */}
            </Select>
          </FormControl>

          <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
            Chọn file Excel
            <input
              type="file"
              accept=".xls,.xlsx"
              hidden
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          {uploadFile && <Typography sx={{ mb: 2 }}>{uploadFile.name}</Typography>}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              variant="contained"
              disabled={!uploadFile || !selectedProvince || loading}
              onClick={handleUpload}
              startIcon={loading ? <Spinner size={20} /> : null}
            >
              {loading ? "Đang upload..." : "Upload"}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default UploadInvoiceWithProvinceDialog;
