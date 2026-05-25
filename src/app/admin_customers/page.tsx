"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box, Button, IconButton, Pagination, Paper, Stack, TextField, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  fetchCustomerMaster_API,
  updateCustomerMaster_API,
  deleteCustomerMaster_API,
  createInvoiceFromMaster_API,
  syncCustomerMasterFromInvoices_API,
  CustomerMasterItem,
} from "@/services/customerMaster.api";

type EditableRow = CustomerMasterItem & {
  _draftTotal?: string;
  _draftPrev?: string;
  _draftPeriod?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = error as { response?: { data?: { message?: unknown } }; message?: unknown };
    if (typeof maybeResponse.response?.data?.message === "string") return maybeResponse.response.data.message;
    if (typeof maybeResponse.message === "string") return maybeResponse.message;
  }
  return fallback;
};

export default function AdminCustomersPage() {
  const [items, setItems] = useState<EditableRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CustomerMasterItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerMasterItem>>({});

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerMaster_API({ page, limit, search });
      setItems(data.items as EditableRow[]);
      setTotal(data.total);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Lỗi tải danh sách tổng"));
    } finally {
      setLoading(false);
    }
  }, [limit, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleDraftChange = (id: string, key: "_draftTotal" | "_draftPrev" | "_draftPeriod", value: string) => {
    setItems((rows) => rows.map((r) => (r._id === id ? { ...r, [key]: value } : r)));
  };

  const handleCreateInvoice = async (row: EditableRow) => {
    const totalAmount = (row._draftTotal || "").trim();
    const previousAmount = (row._draftPrev || "").trim();
    const billing_period = (row._draftPeriod || "").trim();
    if (!totalAmount || Number(totalAmount.replace(/[^\d.-]/g, "")) <= 0) {
      toast.error("Vui lòng nhập Tổng tiền > 0");
      return;
    }
    if (!billing_period) {
      toast.error("Vui lòng nhập Kỳ TT (vd: 04/2026)");
      return;
    }
    const t = toast.loading("Đang tạo hóa đơn...");
    try {
      await createInvoiceFromMaster_API(row._id, { totalAmount, previousAmount: previousAmount || 0, billing_period });
      toast.dismiss(t);
      toast.success(`Đã tạo HĐ ${row.invoiceNumber} kỳ ${billing_period}`);
      setItems((rows) => rows.map((r) => (r._id === row._id ? { ...r, _draftTotal: "", _draftPrev: "", _draftPeriod: "" } : r)));
    } catch (error: unknown) {
      toast.dismiss(t);
      toast.error(getErrorMessage(error, "Tạo hóa đơn thất bại"));
    }
  };

  const openEdit = (row: CustomerMasterItem) => {
    setEditing(row);
    setEditForm({
      customerName: row.customerName || "",
      customerAddress: row.customerAddress || "",
      customerPhone: row.customerPhone || "",
      recordBookCode: row.recordBookCode || "",
      province: row.province || "",
      note: row.note || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const t = toast.loading("Đang lưu...");
    try {
      const updated = await updateCustomerMaster_API(editing._id, {
        ...editForm,
        assignedTo:
          typeof editForm.assignedTo === "object"
            ? editForm.assignedTo?._id ?? null
            : editForm.assignedTo ?? undefined,
      });
      toast.dismiss(t);
      toast.success("Đã lưu");
      setItems((rows) => rows.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)));
      setEditing(null);
    } catch (error: unknown) {
      toast.dismiss(t);
      toast.error(getErrorMessage(error, "Lưu thất bại"));
    }
  };

  const handleDelete = async (row: CustomerMasterItem) => {
    if (!confirm(`Xóa khỏi danh sách tổng: ${row.invoiceNumber} - ${row.customerName || ""}?`)) return;
    try {
      await deleteCustomerMaster_API(row._id);
      toast.success("Đã xóa");
      setItems((rows) => rows.filter((r) => r._id !== row._id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Xóa thất bại"));
    }
  };

  const handleSyncFromInvoices = async () => {
    if (!confirm("Quét toàn bộ kho hóa đơn và bổ sung vào danh sách tổng. Tiếp tục?")) return;
    const t = toast.loading("Đang đồng bộ...");
    try {
      const r = await syncCustomerMasterFromInvoices_API();
      toast.dismiss(t);
      toast.success(r?.message || "Đã đồng bộ");
      void load();
    } catch (error: unknown) {
      toast.dismiss(t);
      toast.error(getErrorMessage(error, "Đồng bộ thất bại"));
    }
  };

  return (
    <ProtectedRoute>
      <Box sx={{ p: { xs: 0.5, sm: 1.5 } }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Danh sách tổng (Khách hàng cố định) — {total.toLocaleString("vi-VN")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
            <Button size="small" variant="outlined" color="warning" startIcon={<SyncIcon />} onClick={handleSyncFromInvoices} fullWidth>
              Đồng bộ từ kho hóa đơn
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="Tìm theo Mã KH / Tên / Địa chỉ / Trạm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            fullWidth
            sx={{ minWidth: { sm: 280, md: 380 } }}
          />
          <Button size="small" variant="contained" onClick={handleSearch} sx={{ width: { xs: "100%", sm: "auto" } }}>Tìm</Button>
          {search && <Button size="small" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} sx={{ width: { xs: "100%", sm: "auto" } }}>Xóa lọc</Button>}
        </Stack>

        <TableContainer component={Paper} sx={{ maxHeight: "70vh", overflowX: "auto" }}>
          <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Mã KH</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên KH</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Địa chỉ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trạm</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Người PT</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Tổng tiền</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Kỳ trước</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Kỳ TT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={9} align="center">Đang tải...</TableCell></TableRow>
              )}
              {!loading && items.length === 0 && (
                <TableRow><TableCell colSpan={9} align="center">Chưa có dữ liệu.</TableCell></TableRow>
              )}
              {items.map((r) => {
                const assignedUser = typeof r.assignedTo === "object" && r.assignedTo ? r.assignedTo : null;
                const npt = assignedUser?.fullName || assignedUser?.username || "";
                return (
                  <TableRow key={r._id} hover>
                    <TableCell sx={{ color: "#dc2626", fontWeight: 600 }}>{r.invoiceNumber}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell>{r.customerAddress}</TableCell>
                    <TableCell>{r.recordBookCode}</TableCell>
                    <TableCell>{npt || <span style={{ color: "#9ca3af" }}>—</span>}</TableCell>
                    <TableCell>
                      <TextField size="small" placeholder="0" value={r._draftTotal || ""} onChange={(e) => handleDraftChange(r._id, "_draftTotal", e.target.value)} sx={{ width: 110 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" placeholder="0" value={r._draftPrev || ""} onChange={(e) => handleDraftChange(r._id, "_draftPrev", e.target.value)} sx={{ width: 110 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" placeholder={r.lastBillingPeriod || "MM/YYYY"} value={r._draftPeriod || ""} onChange={(e) => handleDraftChange(r._id, "_draftPeriod", e.target.value)} sx={{ width: 110 }} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Tạo hóa đơn từ KH này">
                          <span>
                            <Button size="small" variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleCreateInvoice(r)}>
                              Tạo HĐ
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Sửa thông tin KH">
                          <IconButton size="small" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa khỏi danh sách tổng">
                          <IconButton size="small" color="error" onClick={() => handleDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 2 }}>
            <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} color="primary" />
          </Stack>
        )}

        {/* Edit dialog */}
        <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Sửa thông tin KH — {editing?.invoiceNumber}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField size="small" label="Tên KH" value={editForm.customerName || ""} onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))} />
              <TextField size="small" label="Địa chỉ" multiline minRows={2} value={editForm.customerAddress || ""} onChange={(e) => setEditForm((f) => ({ ...f, customerAddress: e.target.value }))} />
              <TextField size="small" label="Số điện thoại" value={editForm.customerPhone || ""} onChange={(e) => setEditForm((f) => ({ ...f, customerPhone: e.target.value }))} />
              <TextField size="small" label="Mã trạm" value={editForm.recordBookCode || ""} onChange={(e) => setEditForm((f) => ({ ...f, recordBookCode: e.target.value }))} />
              <TextField size="small" label="Tỉnh" value={editForm.province || ""} onChange={(e) => setEditForm((f) => ({ ...f, province: e.target.value }))} />
              <TextField size="small" label="Ghi chú" value={editForm.note || ""} onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Hủy</Button>
            <Button variant="contained" onClick={saveEdit}>Lưu</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProtectedRoute>
  );
}
