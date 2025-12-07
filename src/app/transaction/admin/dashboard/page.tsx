"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Grid, TextField, MenuItem, Button, Card, Tabs, Tab, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import DownloadIcon from "@mui/icons-material/Download";

// ... (Các imports và interfaces/services khác giữ nguyên)

import { ITransaction, ITransactionFilterParams, ITransactionPaymentBank, ITransactionType } from "@/types/transaction";
import {
  cancelTransaction,
  deleteTransactionByAdmin,
  deleteTransactionType,
  exportTransactionsToExcelAPI,
  getAllTransactions,
  getBanks,
  getTransactionTypes,
} from "@/services/transaction";
import AdminTransactionTable from "@/components/transaction/admin/AdminTransactionTable";
import ApproveModal from "@/components/transaction/admin/ApproveModal";
import BankFormModal from "@/components/transaction/admin/BankFormModal";
import TransactionTypeFormModal from "@/components/transaction/admin/TransactionTypeFormModal";
import TransactionTypeListCard from "@/components/transaction/admin/TransactionTypeListCard";
import BankListCard from "@/components/transaction/admin/BankListCard";
import EditBankFormModal from "@/components/transaction/admin/EditBankFormModal";
import EditTransactionTypeFormModal from "@/components/transaction/admin/EditTransactionTypeFormModal";
import ExportTransactionModal from "@/components/transaction/admin/ExportTransactionModal";
import { useAuth } from "@/hooks/useAuth";
import TransactionSummary from "@/components/transaction/admin/TransactionSummary";

// --- Hàm hiển thị nội dung Tab (Helper) ---
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
// ------------------------------------------

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ State mới: Theo dõi Tab đang được chọn (0 = Giao dịch, 1 = Cấu hình)
  const [selectedTab, setSelectedTab] = useState(0);

  // ... (Các States khác giữ nguyên: filters, approveId, editTx, openBankModal, openTypeModal, banks, transactionTypes, loadingConfig) ...
  const [filters, setFilters] = useState({ searchName: "", status: "ALL", date: "" });
  const [approveId, setApproveId] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<ITransaction | null>(null);
  const [openBankModal, setOpenBankModal] = useState(false);
  const [openTypeModal, setOpenTypeModal] = useState(false);
  const [banks, setBanks] = useState<ITransactionPaymentBank[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<ITransactionType[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const [editingBank, setEditingBank] = useState<ITransactionPaymentBank | null>(null);
  const [editingType, setEditingType] = useState<ITransactionType | null>(null);

  const [openExportModal, setOpenExportModal] = useState(false);

  const { user } = useAuth();

  const currentUser = user;
  const isAdmin = currentUser?.role === "admin";

  // ... (Các hàm fetch, handleAction giữ nguyên) ...
  const fetchData = useCallback(async () => {
    setLoading(true);
    // ... (Logic tải giao dịch)
    try {
      const params: ITransactionFilterParams = {};
      if (filters.searchName) params.searchName = filters.searchName;
      if (filters.status !== "ALL") params.status = filters.status;
      if (filters.date) {
        params.startDate = filters.date;
        params.endDate = filters.date;
      }
      const res = await getAllTransactions(params);

      setTransactions(res.transactions || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    // ... (Logic tải cấu hình)
    try {
      const [banksRes, typesRes] = await Promise.all([getBanks(), getTransactionTypes()]);
      setBanks(banksRes.banks || []);
      setTransactionTypes(typesRes.data.types || []);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu cấu hình.");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchConfig();
  }, [fetchData, fetchConfig]);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn HỦY giao dịch này?")) return;
    setLoading(true);
    try {
      await cancelTransaction(id);
      toast.success("Đã hủy giao dịch thành công!");
      fetchData(); // Tải lại danh sách giao dịch
    } catch (error) {
      toast.error("Lỗi khi hủy giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("BẠN CÓ CHẮC CHẮN muốn XÓA VĨNH VIỄN giao dịch này? (Hành động này không thể hoàn tác)"))
      return;
    setLoading(true);
    try {
      await deleteTransactionByAdmin(id);
      toast.success("Đã xóa giao dịch thành công!");
      fetchData(); // Tải lại danh sách giao dịch
    } catch (error) {
      toast.error("Lỗi khi xóa giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!window.confirm("Xác nhận xóa loại giao dịch này?")) return;
    setLoading(true);
    try {
      await deleteTransactionType(typeId);
      toast.success("Đã xóa giao dịch thành công!");
      fetchData(); // Tải lại danh sách giao dịch
    } catch (error) {
      toast.error("Lỗi khi xóa giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBank = (bank: ITransactionPaymentBank) => {
    setEditingBank(bank);
  };

  const handleEditType = (type: ITransactionType) => {
    setEditingType(type);
  };

  const handleConfigSuccess = () => {
    setOpenBankModal(false);
    setOpenTypeModal(false);
    setEditingBank(null);
    setEditingType(null);
    fetchConfig(); // Reload cấu hình
  };

  // ✅ Hàm thay đổi tab
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
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
    } catch (error) {
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🛡️ Quản Lý Giao Dịch (Admin)
      </Typography>

      {/* --- THANH TABS --- */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={selectedTab} onChange={handleChangeTab} aria-label="admin tabs">
          <Tab label="Quản Lý Giao Dịch" />
          <Tab label="Cấu Hình & Thiết Lập" />
        </Tabs>
      </Box>

      {/* --- NỘI DUNG TAB 1: GIAO DỊCH VÀ LỌC --- */}
      <CustomTabPanel value={selectedTab} index={0}>
        {/* --- PHẦN BỘ LỌC VÀ TOOLBAR --- */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            {/* ⚠️ Lỗi Grid: Cần thêm item và kích thước (xs, md) */}
            <Grid>
              <TextField
                label="Tìm tên CTV"
                fullWidth
                value={filters.searchName}
                onChange={(e) => setFilters({ ...filters, searchName: e.target.value })}
              />
            </Grid>
            <Grid>
              <TextField
                select
                label="Trạng thái"
                fullWidth
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="ALL">Tất cả</MenuItem>
                <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                <MenuItem value="CANCELLED">Đã hủy</MenuItem>
              </TextField>
            </Grid>
            <Grid>
              <TextField
                type="date"
                label="Ngày tạo"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </Grid>
            <Grid>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setFilters({ searchName: "", status: "ALL", date: "" })}
              >
                {" "}
                Reset{" "}
              </Button>
            </Grid>

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
          </Grid>
        </Card>

        <TransactionSummary transactions={transactions} />

        {/* --- BẢNG DỮ LIỆU GIAO DỊCH --- */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <AdminTransactionTable
            data={transactions}
            onApprove={(id) => setApproveId(id)}
            onCancel={handleCancel}
            onEdit={(tx) => setEditTx(tx)}
            onDelete={handleDelete}
          />
        )}
      </CustomTabPanel>

      {/* --- NỘI DUNG TAB 2: CẤU HÌNH --- */}
      <CustomTabPanel value={selectedTab} index={1}>
        <Grid container spacing={3}>
          {/* Card Loại GD */}
          <Grid>
            <TransactionTypeListCard
              types={transactionTypes}
              loading={loadingConfig}
              onAddType={() => setOpenTypeModal(true)}
              onEditType={handleEditType}
              onReload={fetchConfig}
              onDeleteType={handleDeleteType}
            />
          </Grid>
          {/* Card Ngân hàng */}
          <Grid>
            <BankListCard
              banks={banks}
              loading={loadingConfig}
              onAddBank={() => setOpenBankModal(true)}
              onEditBank={handleEditBank}
              onReload={fetchConfig}
            />
          </Grid>
        </Grid>
      </CustomTabPanel>

      {/* --- MODAL (Luôn render bên ngoài Tab Panels) --- */}
      <ApproveModal
        open={!!approveId}
        onClose={() => setApproveId(null)}
        transactionId={approveId}
        onSuccess={fetchData}
      />

      <BankFormModal open={openBankModal} onClose={() => setOpenBankModal(false)} onSuccess={handleConfigSuccess} />

      <EditBankFormModal
        open={!!editingBank}
        onClose={() => setEditingBank(null)} // Đóng và reset state
        bank={editingBank} // Truyền đối tượng ngân hàng
        onSuccess={handleConfigSuccess} // Reload Config sau khi thành công
      />

      <TransactionTypeFormModal
        open={openTypeModal}
        onClose={() => setOpenTypeModal(false)}
        onSuccess={handleConfigSuccess}
      />

      <EditTransactionTypeFormModal
        open={!!editingType}
        onClose={() => setEditingType(null)}
        transactionType={editingType}
        onSuccess={handleConfigSuccess}
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
