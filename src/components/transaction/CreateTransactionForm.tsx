"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, TextField, MenuItem, Typography, CircularProgress, Card, CardContent } from "@mui/material";
import toast from "react-hot-toast";
import { ITransaction, ITransactionType } from "@/types/transaction";
import { createTransaction, getTransactionTypes } from "@/services/transaction";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

interface Props {
  onSuccess?: () => void;
}

const initialFormData: Partial<ITransaction> = {
  amount: 0,
  typeId: "",
};

const CreateTransactionForm: React.FC<Props> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<Partial<ITransaction>>(initialFormData);
  const [transactionTypes, setTransactionTypes] = useState<ITransactionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await getTransactionTypes();
        if (res?.data.types) {
          setTransactionTypes(res.data.types);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const amount = Number(formData.amount);
  const isSubmitDisabled = loading || amount <= 0 || !formData.typeId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createTransaction({ amount, typeId: formData.typeId });
      if (res?.status === 201) {
        toast.success("Tạo giao dịch thành công!");
        setFormData(initialFormData);
        onSuccess?.();
      }
    } catch (err) {
      toast.error("Lỗi khi tạo giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e0e0e0", overflow: "visible" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
          <AddCircleOutlineIcon color="primary" />
          <Typography variant="h6" fontSize="1rem" fontWeight="bold">
            Tạo Báo Cáo Mới
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Loại Giao dịch */}
          <TextField
            select
            fullWidth
            size="small"
            label="Chọn loại giao dịch"
            name="typeId"
            value={formData.typeId}
            onChange={handleChange}
            disabled={loadingTypes}
          >
            {loadingTypes ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : transactionTypes.length === 0 ? (
              <MenuItem disabled>Không có dữ liệu</MenuItem>
            ) : (
              transactionTypes.map((option) => (
                <MenuItem key={option._id} value={option._id}>
                  {option.name}
                </MenuItem>
              ))
            )}
          </TextField>

          {/* Số tiền - Tự động Focus */}
          <TextField
            required
            fullWidth
            size="small"
            label="Số tiền (VNĐ)"
            name="amount"
            type="number"
            value={formData.amount || ""}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0 } }}
            helperText="Nhập số tiền thực tế của giao dịch"
          />

          {/* Button Submit */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitDisabled}
            sx={{ mt: 1, textTransform: "none", fontWeight: "bold" }}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? "Đang xử lý..." : "Xác nhận tạo"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateTransactionForm;
