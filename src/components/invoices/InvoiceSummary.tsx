// components/invoices/InvoiceSummary.tsx

import { Box, Paper, Typography } from "@mui/material";

interface StatusDetail {
  count: number;
  amount: number;
}

interface InvoiceSummaryProps {
  filterAssignedUser?: string;
  totalUsers?: number;
  assignedCustomerCodes: number;
  unassignedCustomerCodes: number;
  totalAmountInfo: number;
  collected?: StatusDetail;
  notCollected?: StatusDetail;
  isPaid?: StatusDetail;
}

const DEFAULT_DATA: StatusDetail = { count: 0, amount: 0 };

const formatVnd = (n: number) => `${n.toLocaleString("vi-VN")}`;
const formatCount = (n: number) => n.toLocaleString("vi-VN");

interface Segment {
  key: "collected" | "notCollected" | "isPaid";
  label: string;
  data: StatusDetail;
  color: string;
  textColor: string;
}

export default function InvoiceSummary({
  assignedCustomerCodes,
  unassignedCustomerCodes,
  totalAmountInfo,
  collected,
  notCollected,
  isPaid,
}: InvoiceSummaryProps) {
  const c = collected ?? DEFAULT_DATA;
  const n = notCollected ?? DEFAULT_DATA;
  const p = isPaid ?? DEFAULT_DATA;
  const totalCount = c.count + n.count + p.count;

  const segments: Segment[] = [
    { key: "collected", label: "Đã thu", data: c, color: "#16a34a", textColor: "#ffffff" },
    { key: "notCollected", label: "Chưa thu", data: n, color: "#facc15", textColor: "#1f2937" },
    { key: "isPaid", label: "Đã đóng cước", data: p, color: "#9ca3af", textColor: "#ffffff" },
  ];
  const visible = segments.filter((s) => s.data.count > 0);
  const renderSegments = visible.length > 0 ? visible : [segments[1]];

  const rows = [
    {
      label: "Mã KH có pt",
      value: formatCount(assignedCustomerCodes),
      color: "#16a34a",
    },
    {
      label: "Mã KH chưa pt",
      value: formatCount(unassignedCustomerCodes),
      color: "#16a34a",
    },
    {
      label: "Tổng tiền",
      value: `${(totalAmountInfo ?? 0).toLocaleString("vi-VN")}`,
      color: "#dc2626",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        mb: 1,
        backgroundColor: "transparent",
        borderRadius: 0,
        border: "none",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: 2,
        }}
      >
        {/* === LEFT: 3 hàng số liệu === */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0.5,
            minWidth: { xs: "100%", md: 280 },
            flexShrink: 0,
            px: 1,
          }}
        >
          {rows.map((r) => (
            <Box
              key={r.label}
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography sx={{ color: "#6b7280", fontSize: "0.9rem" }}>
                {r.label}:
              </Typography>
              <Typography sx={{ fontWeight: 700, color: r.color, fontSize: "1.05rem" }}>
                {r.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* === RIGHT: thanh tiến độ thu === */}
        <Box
          sx={{
            display: "flex",
            flexGrow: 1,
            minHeight: 88,
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
                <Typography sx={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>
                  {formatVnd(s.data.amount)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
