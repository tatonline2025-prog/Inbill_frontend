// components/invoices/InvoiceSummary.tsx

import { Box, Typography } from "@mui/material";

interface InvoiceSummaryProps {
  filterAssignedUser?: string;
  totalUsers?: number;
  assignedCustomerCodes: number;
  unassignedCustomerCodes: number;
  totalAmountInfo: number;
}

export default function InvoiceSummary({
  filterAssignedUser,
  totalUsers,
  assignedCustomerCodes,
  unassignedCustomerCodes,
  totalAmountInfo,
}: InvoiceSummaryProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-around",
        alignItems: "center",
        textAlign: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 2,
        p: 2,
        mb: 3,
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        gap: 2,
      }}
    >
      {filterAssignedUser === "all" && (
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Tổng số nhân viên
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#2563eb" }}>
            {totalUsers}
          </Typography>
        </Box>
      )}

      <Box sx={{ minWidth: 200 }}>
        <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Số mã khách hàng đang phụ trách
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#16a34a" }}>
          {assignedCustomerCodes - unassignedCustomerCodes}
        </Typography>
      </Box>

      <Box sx={{ minWidth: 200 }}>
        <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Số mã khách hàng chưa được phụ trách
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#16a34a" }}>
          {unassignedCustomerCodes}
        </Typography>
      </Box>

      <Box sx={{ minWidth: 200 }}>
        <Typography variant="subtitle2" sx={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Tổng giá trị hoá đơn
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#dc2626" }}>
          {totalAmountInfo.toLocaleString("vi-VN")} đ
        </Typography>
      </Box>
    </Box>
  );
}
