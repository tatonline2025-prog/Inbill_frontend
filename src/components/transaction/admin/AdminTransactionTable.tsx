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

// ... (Copy lại các hàm helper formatCurrency, formatDate, getStatusColor từ TransactionTable cũ)
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN");

export default function AdminTransactionTable({ data, onApprove, onCancel, onEdit, onDelete }: Props) {
  const getCreatorName = (creatorId: ITransaction["creatorId"]): string => {
    if (typeof creatorId === "object" && creatorId !== null && "fullName" in creatorId) {
      return (creatorId as IUser).fullName;
    }

    return creatorId?.toString() || "N/A";
  };

  const getBankDisplay = (bankId: ITransaction["paymentBankId"]): string => {
    if (!bankId) return "-";

    // Nếu Backend có populate Bank (Object), ta sẽ lấy tên và số TK
    if (typeof bankId === "object" && "bankName" in bankId) {
      return `${(bankId as ITransactionPaymentBank).bankName} - (${
        (bankId as ITransactionPaymentBank).accountNumber
      }) - ${(bankId as ITransactionPaymentBank).accountHolder}`;
    }

    // Nếu chưa populate (chỉ là ID chuỗi)
    return `ID: ${bankId}`;
  };

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead sx={{ bgcolor: "primary.dark" }}>
          <TableRow>
            <TableCell sx={{ color: "white" }}>STT</TableCell>
            <TableCell sx={{ color: "white" }}>Ngày Tạo</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>CTV</TableCell>
            <TableCell sx={{ color: "white" }}>Loại GD</TableCell>
            <TableCell sx={{ color: "white" }}>Số tiền sau chiết khấu</TableCell>
            <TableCell sx={{ color: "white" }}>Ngân hàng nhận tiền</TableCell>
            <TableCell sx={{ color: "white" }}>Trạng Thái</TableCell>
            <TableCell sx={{ color: "white" }} align="center">
              Hành Động
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => {
            // Kiểm tra trạng thái duyệt để ẩn/hiện nút Sửa/Xóa/Duyệt
            const isPending = row.status === "PENDING";
            const canEditOrDelete = isPending;

            return (
              // Bỏ khoảng trắng dư thừa trong các thẻ, hoặc giữ cú pháp gọn gàng
              <TableRow key={row._id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>

                {/* SỬA LỖI: Sử dụng helper kiểm tra populate */}
                <TableCell>{getCreatorName(row.creatorId)}</TableCell>

                <TableCell>{(row.typeId as ITransactionType)?.name || "N/A"}</TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {formatCurrency(row.finalAmount)}
                </TableCell>

                <TableCell>{getBankDisplay(row.paymentBankId)}</TableCell>

                <TableCell>
                  <Chip
                    label={row.status === "APPROVED" ? "Đã duyệt" : row.status === "PENDING" ? "Chờ duyệt" : "Đã hủy"}
                    color={row.status === "APPROVED" ? "success" : row.status === "PENDING" ? "warning" : "error"}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  {isPending && (
                    <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                      {/* Duyệt & Hủy */}
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

                      {/* Xóa (Chỉ khi Pending) */}
                      <Tooltip title="Xóa">
                        <IconButton size="small" onClick={() => onDelete(row._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                  {!isPending && "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
