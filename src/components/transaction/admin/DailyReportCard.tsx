// src/components/admin/report/DailyReportCard.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalculateIcon from "@mui/icons-material/Calculate";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PersonIcon from "@mui/icons-material/Person";

// --- Interface cập nhật theo đúng Data thực tế ---
interface TransactionDetail {
  _id: string;
  transactionType: string;
  amount: number;
  discountPercent: number;
  finalAmount: number;
  createdAt: string;
  creatorName: string;
  status: string;
}

interface ReportData {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  totalFinalAmount: number;
  transactions: TransactionDetail[];
}

interface ReportMetricProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  isCurrency: boolean;
}

// --- Helpers ---
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

// Hàm lấy màu cho trạng thái
const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "CANCELLED":
      return "error";
    default:
      return "default";
  }
};

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

export default function DailyReportCard({ report }: { report: ReportData }) {
  const [expanded, setExpanded] = useState(false);

  // Component hiển thị chỉ số (được thu gọn padding để nhìn thanh thoát hơn)
  const ReportMetric = ({ icon, title, value, color, isCurrency }: ReportMetricProps) => (
    <Box sx={{ p: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        {icon}
        <Typography variant="body2" color="textSecondary" sx={{ ml: 1, fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight={700} color={color} sx={{ ml: isCurrency ? 0 : 4 }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Card elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: "hidden", border: "1px solid #e0e0e0" }}>
      {/* --- Header Tổng Quan --- */}
      <CardContent
        onClick={() => setExpanded(!expanded)}
        sx={{
          cursor: "pointer",
          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.02)" },
          transition: "0.2s",
          pb: "16px !important", // Override default padding-bottom of CardContent
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            {new Date(report.date).toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography variant="caption" sx={{ mr: 1, color: "text.secondary" }}>
              {expanded ? "Thu gọn" : "Chi tiết"}
            </Typography>
            <IconButton size="small">{expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid>
            <ReportMetric
              icon={<ReceiptLongIcon fontSize="small" color="primary" />}
              title="Số GD"
              value={report.totalTransactions}
              color="text.primary"
              isCurrency={false}
            />
          </Grid>
          <Grid sx={{ borderLeft: "1px solid #eee" }}>
            <ReportMetric
              icon={<AttachMoneyIcon fontSize="small" color="error" />}
              title="Tiền Gốc"
              value={formatVND(report.totalAmount)}
              color="error.main"
              isCurrency={true}
            />
          </Grid>
          <Grid sx={{ borderLeft: "1px solid #eee" }}>
            <ReportMetric
              icon={<CalculateIcon fontSize="small" color="success" />}
              title="Thực Nhận"
              value={formatVND(report.totalFinalAmount)}
              color="success.main"
              isCurrency={true}
            />
          </Grid>
        </Grid>
      </CardContent>

      {/* --- Chi Tiết Giao Dịch --- */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ bgcolor: "#fafafa", p: 2, borderTop: "1px solid #eee" }}>
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #eee" }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell width="50px" align="center">
                    <strong>#</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Thời gian</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Người tạo</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Loại GD</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Số tiền</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Chiết khấu (%)</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Thực nhận</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Trạng thái</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.transactions.map((row, index) => (
                  <TableRow key={row._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell align="center" component="th" scope="row">
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatTime(row.createdAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PersonIcon fontSize="inherit" color="action" />
                        {row.creatorName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.transactionType} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: "text.secondary", textDecoration: "line-through", fontSize: "0.875rem" }}
                    >
                      {formatVND(row.amount)}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "error.main", fontWeight: "bold" }}>
                      {row.discountPercent}%
                    </TableCell>
                    <TableCell align="right" sx={{ color: "success.main", fontWeight: "bold", fontSize: "1rem" }}>
                      {formatVND(row.finalAmount)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(row.status)}
                        size="small"
                        color={getStatusColor(row.status)}
                        sx={{ fontWeight: 500, minWidth: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {report.transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        Không có dữ liệu giao dịch
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Card>
  );
}
