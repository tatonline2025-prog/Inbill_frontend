import { Box, Paper, Typography } from "@mui/material";

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

const formatVnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;
const formatCount = (n: number) => n.toLocaleString("vi-VN");

interface Segment {
  key: "collected" | "notCollected" | "isPaid";
  label: string;
  data: StatusDetail;
  color: string;
  textColor: string;
}

export default function CollectionSummary({ collected, notCollected, isPaid }: CollectionSummaryProps) {
  const c = collected ?? DEFAULT_DATA;
  const n = notCollected ?? DEFAULT_DATA;
  const p = isPaid ?? DEFAULT_DATA;

  const totalCount = c.count + n.count + p.count;

  const segments: Segment[] = [
    { key: "collected", label: "Đã thu", data: c, color: "#16a34a", textColor: "#ffffff" },
    { key: "notCollected", label: "Chưa thu", data: n, color: "#facc15", textColor: "#1f2937" },
    { key: "isPaid", label: "Đã đóng cước", data: p, color: "#9ca3af", textColor: "#ffffff" },
  ];

  // Chỉ hiển thị các segment có dữ liệu (count > 0); nếu không có dữ liệu nào, vẫn render thanh trống màu vàng (chưa thu)
  const visible = segments.filter((s) => s.data.count > 0);
  const renderSegments = visible.length > 0 ? visible : [segments[1]];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        backgroundColor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          minHeight: 72,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        {renderSegments.map((s) => {
          const pct = totalCount > 0 ? (s.data.count / totalCount) * 100 : 0;
          return (
            <Box
              key={s.key}
              sx={{
                // Chiều rộng tỉ lệ với số HĐ; minWidth để đảm bảo đủ chỗ hiển thị text khi quá nhỏ
                flexGrow: Math.max(s.data.count, 1),
                flexBasis: 0,
                minWidth: 140,
                backgroundColor: s.color,
                color: s.textColor,
                px: 1.5,
                py: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                borderRight: "1px solid rgba(255,255,255,0.4)",
                "&:last-child": { borderRight: "none" },
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.9, textTransform: "uppercase" }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>
                {formatCount(s.data.count)} HĐ ({pct.toFixed(1)}%)
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.95 }}>
                {formatVnd(s.data.amount)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
