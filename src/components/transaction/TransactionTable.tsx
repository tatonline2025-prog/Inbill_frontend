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
  Typography,
  Box,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { ITransaction, ITransactionPaymentBank, ITransactionType } from "@/types/transaction";
import { IUser } from "@/types/user";

interface Props {
  data: ITransaction[];
  isAdmin?: boolean;
  onEdit: (transaction: ITransaction) => void;
  onDelete: (id: string) => void;
}

const TransactionTable: React.FC<Props> = ({ data, isAdmin = false, onEdit, onDelete }) => {
  // --- Helper: Màu sắc trạng thái ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success"; // Xanh lá
      case "PENDING":
        return "warning"; // Cam
      case "CANCELLED":
        return "error"; // Đỏ
      default:
        return "default";
    }
  };

  // --- Helper: Tên hiển thị trạng thái ---
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Đã duyệt";
      case "PENDING":
        return "Chờ duyệt";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // --- Helper: Format tiền tệ ---
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  // --- Helper: Format ngày ---
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="textSecondary">Chưa có dữ liệu giao dịch nào.</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="transaction table">
        <TableHead sx={{ bgcolor: "primary.light" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>STT</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Loại Giao Dịch</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Số Tiền</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Chiết Khấu</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Sau chiết khấu</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Hình thức thanh toán</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Ngân hàng của bạn</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }} align="center">
              Trạng Thái
            </TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Ngày Tạo</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "white" }} align="center">
              Hành Động
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => {
            // Logic ẩn hiện nút: Chỉ cho phép sửa/xóa khi trạng thái là PENDING
            const canAction = row.status === "PENDING";

            return (
              <TableRow
                key={row._id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 }, "&:hover": { bgcolor: "action.hover" } }}
              >
                <TableCell component="th" scope="row">
                  {index + 1}
                </TableCell>
                <TableCell>
                  {/* Kiểm tra an toàn null safe (optional chaining) vì typeId là object */}
                  {(row.typeId as ITransactionType)?.name || "N/A"}
                </TableCell>
                <TableCell>{formatCurrency(row.amount)}</TableCell>
                <TableCell>{row.discountPercent}%</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {formatCurrency(row.finalAmount)}
                </TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {/* Kiểm tra: Nếu paymentSourceId tồn tại và có bankName thì hiển thị tên bank */}
                  {row.paymentSourceId && (row.paymentSourceId as ITransactionPaymentBank).bankName ? (
                    <>{(row.paymentSourceId as ITransactionPaymentBank)?.bankName} </>
                  ) : (
                    // Ngược lại, hiển thị thông báo chờ xác nhận
                    "Chờ phía công ty xác nhận"
                  )}
                </TableCell>

                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {(row.creatorId as IUser)?.bankName} - {(row.creatorId as IUser)?.bankAccount}
                </TableCell>

                <TableCell align="center">
                  <Chip
                    label={getStatusLabel(row.status)}
                    color={getStatusColor(row.status)}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell align="center">
                  {canAction ? (
                    <Box>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton color="primary" size="small" onClick={() => onEdit(row)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton color="error" size="small" onClick={() => onDelete(row._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: "italic" }}>
                      {row.status === "APPROVED" ? "Đã khóa" : "Không khả dụng"}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionTable;
