"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import { CheckCircle, Cancel, Edit, Delete } from "@mui/icons-material";
import { ITransaction, ITransactionPaymentBank, ITransactionType } from "@/types/transaction";
import { IUser } from "@/types/user";

interface Props {
  data: ITransaction[];
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: (t: ITransaction) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminTransactionTable({ data, onApprove, onCancel, onEdit, onDelete }: Props) {
  return (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead sx={{ bgcolor: "primary.dark" }}>
          <TableRow>
            <TableCell sx={{ color: "white" }}>STT</TableCell>
            <TableCell sx={{ color: "white" }}>Ngày Tạo</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>CTV & TK Nhận</TableCell>
            <TableCell sx={{ color: "white" }}>Loại GD & Chiết khấu</TableCell>
            <TableCell sx={{ color: "white" }}>Số tiền gốc</TableCell>
            <TableCell sx={{ color: "white" }}>Thực nhận</TableCell>
            <TableCell sx={{ color: "white" }}>Nguồn thanh toán</TableCell>
            <TableCell sx={{ color: "white" }}>Trạng Thái</TableCell>
            <TableCell sx={{ color: "white" }} align="center">
              Hành Động
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => {
            const isPending = row.status === "PENDING";

            // 1. Xử lý dữ liệu CTV (Inline logic)
            // Kiểm tra xem creatorId có phải là object user đầy đủ không
            const creator = row.creatorId as IUser | string;
            const isCreatorPopulated = typeof creator === "object" && creator !== null;

            // 2. Xử lý dữ liệu Ngân hàng thanh toán (Inline logic)
            const paymentBank = row.paymentSourceId as ITransactionPaymentBank | string | null;
            const isPaymentBankPopulated = typeof paymentBank === "object" && paymentBank !== null;

            // 3. Lấy tên loại giao dịch
            const typeName = (row.typeId as ITransactionType)?.name || "N/A";

            return (
              <TableRow key={row._id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>

                {/* --- CỘT CTV & TK NHẬN --- */}
                <TableCell>
                  {isCreatorPopulated ? (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {(creator as IUser).fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                        {(creator as IUser).bankName} - {(creator as IUser).bankAccount}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2">{row.creatorId?.toString() || "N/A"}</Typography>
                  )}
                </TableCell>

                {/* --- CỘT LOẠI GD & CHIẾT KHẤU --- */}
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {typeName}
                  </Typography>
                  <Typography variant="caption" color="error.dark">
                    Chiết khấu: {row.discountPercent || 0}%
                  </Typography>
                </TableCell>

                <TableCell>{formatCurrency(row.amount)}</TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {formatCurrency(row.finalAmount)}
                </TableCell>

                {/* --- CỘT NGUỒN THANH TOÁN --- */}
                <TableCell>
                  {row.status === "CANCELLED" ? (
                    <Chip label="GD đã huỷ" color="error" size="small" variant="outlined" />
                  ) : !row.paymentSourceId ? (
                    <Chip label="Chờ xác nhận" color="warning" size="small" variant="outlined" />
                  ) : isPaymentBankPopulated ? (
                    <Box>
                      <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                        {(paymentBank as ITransactionPaymentBank).bankName}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2">ID: {row.paymentSourceId.toString()}</Typography>
                  )}
                </TableCell>

                {/* --- TRẠNG THÁI --- */}
                <TableCell>
                  <Chip
                    label={row.status === "APPROVED" ? "Đã duyệt" : row.status === "PENDING" ? "Chờ duyệt" : "Đã hủy"}
                    color={row.status === "APPROVED" ? "success" : row.status === "PENDING" ? "warning" : "error"}
                    size="small"
                  />
                </TableCell>

                {/* --- HÀNH ĐỘNG --- */}
                <TableCell align="center">
                  {isPending ? (
                    <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                      <Tooltip title="Duyệt">
                        <IconButton color="success" size="small" onClick={() => onApprove(row._id)}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hủy">
                        <IconButton color="error" size="small" onClick={() => onCancel(row._id)}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" onClick={() => onDelete(row._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* <Tooltip title="Sửa">
                        <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip> */}
                    </Box>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
