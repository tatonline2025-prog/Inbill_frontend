import React, { useMemo } from "react";
import { Grid, Typography, Box, Divider, Stack } from "@mui/material";
import { ITransaction } from "@/types/transaction";

// Hàm format tiền tệ
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

interface TransactionSummaryProps {
  transactions: ITransaction[];
}

export default function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const stats = useMemo(() => {
    const initialStats = {
      totalCount: 0,
      approvedCount: 0,
      approvedAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      cancelledCount: 0,
    };

    return transactions.reduce((acc, curr) => {
      acc.totalCount += 1;
      const amount = curr.finalAmount ?? curr.amount ?? 0;

      switch (curr.status) {
        case "APPROVED":
          acc.approvedCount += 1;
          acc.approvedAmount += amount;
          break;
        case "PENDING":
          acc.pendingCount += 1;
          acc.pendingAmount += amount;
          break;
        case "CANCELLED":
          acc.cancelledCount += 1;
          break;
        default:
          break;
      }
      return acc;
    }, initialStats);
  }, [transactions]);

  // Component con hiển thị từng chỉ số (chỉ Text)
  const StatItem = ({
    label,
    count,
    amount,
    color,
  }: {
    label: string;
    count: number;
    amount?: number;
    color: string;
  }) => (
    <Box sx={{ px: 2 }}>
      {/* Label nhỏ màu xám */}
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </Typography>

      {/* Số tiền to và nổi bật */}
      <Box sx={{ mt: 0.5, mb: 0.5 }}>
        {amount !== undefined ? (
          <Typography variant="h5" fontWeight={700} sx={{ color: color }}>
            {formatCurrency(amount)}
          </Typography>
        ) : (
          // Nếu không có tiền (ví dụ mục Huỷ), hiển thị gạch ngang hoặc chỉ số lượng
          <Typography variant="h5" fontWeight={700} sx={{ color: color }}>
            --
          </Typography>
        )}
      </Box>

      {/* Số lượng đơn hiển thị nhỏ hơn bên dưới */}
      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
        {count} <span style={{ color: "#888", fontWeight: 400 }}>đơn</span>
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ mb: 4, mt: 1 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }} // Xếp dọc trên mobile, xếp ngang trên desktop
        divider={<Divider orientation="vertical" flexItem />} // Divider chỉ hoạt động trên Stack
        spacing={{ xs: 3, sm: 0 }} // Giãn cách giữa các mục (dọc trên mobile, ngang trên desktop)
        justifyContent="space-around"
        sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }} // Thêm border nhẹ để làm nổi bật
      >
        <Grid>
          <StatItem
            label="Tổng giao dịch"
            count={stats.totalCount}
            amount={stats.approvedAmount + stats.pendingAmount}
            color="#1976d2"
          />
        </Grid>

        <Grid>
          <StatItem label="Đã duyệt" count={stats.approvedCount} amount={stats.approvedAmount} color="#2e7d32" />
        </Grid>

        <Grid>
          <StatItem label="Đang chờ duyệt" count={stats.pendingCount} amount={stats.pendingAmount} color="#ed6c02" />
        </Grid>

        <Grid>
          <StatItem
            label="Đã huỷ"
            count={stats.cancelledCount}
            amount={undefined} // Không hiện tiền
            color="#d32f2f"
          />
        </Grid>
      </Stack>

      {/* Đường kẻ ngang ngăn cách với phần filter bên dưới cho gọn */}
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
}
