"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Grid, CircularProgress, Card, CardContent, Button } from "@mui/material";
import toast from "react-hot-toast";
import CreateTransactionForm from "@/components/transaction/CreateTransactionForm";
import TransactionTable from "@/components/transaction/TransactionTable";
import { ITransaction } from "@/types/transaction";
import { deleteTransaction, exportTransactionsToExcelAPI, getUserTransactions } from "@/services/transaction";
import EditTransactionModal from "@/components/transaction/EditTransactionModal";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DownloadIcon from "@mui/icons-material/Download";
import ExportTransactionModal from "@/components/transaction/admin/ExportTransactionModal";
import { IUser } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";
import TransactionSummary from "@/components/transaction/admin/TransactionSummary";

export default function UserDashboardPage() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null);

  const [openExportModal, setOpenExportModal] = useState(false);

  const { user } = useAuth();

  const currentUser = user;
  const isAdmin = currentUser?.role === "admin";

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserTransactions();

      console.log(res);

      if (res.data?.transactions) {
        setTransactions(res.data?.transactions);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách giao dịch.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleEdit = (record: ITransaction) => {
    setSelectedTransaction(record);
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedTransaction(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này không?")) {
      try {
        await deleteTransaction(id);
        toast.success("Đã xóa giao dịch.");
        fetchTransactions();
      } catch (error) {
        toast.error("Xóa thất bại.");
      }
    }
  };

  const handleTransactionUpdated = () => {
    fetchTransactions();
  };

  const handleExportExcel = async (filter: {
    type: string;
    date: string;
    collaborator: string;
    collaboratorName: string;
  }) => {
    const loadingToast = toast.loading("Đang tạo file Excel...");
    try {
      const res = await exportTransactionsToExcelAPI(filter);
      // saveAs(res.blob, "Bao_cao_giao_dich.xlsx");

      toast.success(
        `Đã xuất Excel thành công! \n(CTV: ${filter.collaboratorName || "Tất cả"}, Ngày: ${
          filter.type === "ALL_DATE" ? "All" : filter.date
        })`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Lỗi khi xuất file Excel");
      }
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header gọn gàng */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <DashboardIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Tổng quan Cộng Tác Viên
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Quản lý giao dịch và báo cáo doanh thu
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Cột Trái: Form Tạo (Sticky để luôn nhìn thấy khi cuộn bảng) */}
        <Grid>
          <Box sx={{ position: { md: "sticky" }, top: { md: 24 } }}>
            <CreateTransactionForm onSuccess={handleTransactionUpdated} />
          </Box>
        </Grid>

        <TransactionSummary transactions={transactions} />

        {/* Cột Phải: Bảng Danh Sách */}
        <Grid>
          <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Lịch sử giao dịch
                </Typography>
                <Grid>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={() => setOpenExportModal(true)}
                  >
                    Xuất Excel
                  </Button>
                </Grid>

                <Typography variant="body2" color="textSecondary" sx={{ alignSelf: "center" }}>
                  Tổng: {transactions.length} bản ghi
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TransactionTable data={transactions} isAdmin={false} onEdit={handleEdit} onDelete={handleDelete} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <EditTransactionModal
        open={openEditModal}
        onClose={handleCloseEditModal}
        transaction={selectedTransaction}
        onSuccess={handleTransactionUpdated}
      />

      <ExportTransactionModal
        open={openExportModal}
        onClose={() => setOpenExportModal(false)}
        onExport={handleExportExcel}
        currentUser={currentUser}
        isAdmin={isAdmin}
      />
    </Box>
  );
}
