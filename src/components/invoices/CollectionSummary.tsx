import { Box, Typography, Divider, Paper } from "@mui/material";

interface StatusDetail {
  count: number;
  amount: number;
}

export interface CollectionSummaryProps {
  collected?: StatusDetail;
  notCollected?: StatusDetail;
  isPaid?: StatusDetail;
  total?: StatusDetail;
  loading?: boolean;
}

const DEFAULT_DATA: StatusDetail = { count: 0, amount: 0 };

export default function CollectionSummary({ collected, notCollected, isPaid }: CollectionSummaryProps) {
  const SummaryItem = ({
    label,
    data = DEFAULT_DATA,
    color,
    bgColor,
  }: {
    label: string;
    data?: StatusDetail;
    color: string;
    bgColor: string;
  }) => (
    <Box
      sx={{
        minWidth: 180,
        flex: "1 1 200px",
        py: 1,
        backgroundColor: bgColor,
        borderRadius: 2,
        border: `1px solid ${color}20`,
        textAlign: "center",
      }}
    >
      <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.7 rem", fontWeight: 500 }}>
        {label.toUpperCase()}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: color }}>
          {data.count.toLocaleString("vi-VN")} <span style={{ fontSize: "0.8rem" }}>HĐ</span>
        </Typography>
        <Divider sx={{ my: 0.5, opacity: 0.5 }} />
        <Typography variant="body1" sx={{ fontWeight: 600, color: "#374151" }}>
          {data.amount.toLocaleString("vi-VN")} <span style={{ fontSize: "0.7rem" }}>đ</span>
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        p: 2,
        mb: 3,
        backgroundColor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      }}
    >
      <SummaryItem label="Đã thu" data={collected} color="#16a34a" bgColor="#f0fdf4" />

      <SummaryItem label="Chưa thu" data={notCollected} color="#ea580c" bgColor="#fff7ed" />

      {isPaid && (isPaid.count > 0 || isPaid.amount > 0) && (
        <SummaryItem label="Đã đóng cước" data={isPaid} color="#2563eb" bgColor="#eff6ff" />
      )}

      {/* <SummaryItem label="Tổng danh sách" data={total} color="#dc2626" bgColor="#fef2f2" /> */}
    </Paper>
  );
}
