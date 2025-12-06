// src/pages/admin/report/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import toast from "react-hot-toast";
import DailyReportCard from "@/components/transaction/admin/DailyReportCard";
import { getDailyReport } from "@/services/transaction";

export default function AdminReportPage() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Có thể thêm tham số startDate, endDate nếu cần lọc
        const res = await getDailyReport();
        setReportData(res.report || []);
      } catch (error) {
        toast.error("Không thể tải báo cáo.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Báo Cáo Giao Dịch Hàng Ngày
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : reportData.length === 0 ? (
        <Alert severity="info">Không tìm thấy báo cáo trong phạm vi này.</Alert>
      ) : (
        reportData.map((report, index) => <DailyReportCard key={index} report={report} />)
      )}
    </Box>
  );
}
