// components/invoices/ExportModals.tsx

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { IUser } from "@/types/user";
import { useEffect, useMemo, useState } from "react";

export const FILTER_STATUS = {
  ALL: "all",
  PAID: "collected",
  UNPAID: "not_collected",
};

export const CLOSING_STATUS = {
  ALL: "all",
  TRUE: "true",
  FALSE: "false",
};

interface ExportModalsProps {
  userData: IUser[];

  // --- Export By User ---
  openExportByUser: boolean;
  selectedExportUser: string;
  setOpenExportByUser: (open: boolean) => void;
  setSelectedExportUser: (userId: string) => void;
  handleExportByUserConfirm: () => Promise<void>;

  // --- Export Collected ---
  openExportCollected: boolean;
  setOpenExportCollected: (open: boolean) => void;
  handleExportCollectedConfirm: () => Promise<void>;

  openExportModal: boolean;
  setOpenExportModal: (open: boolean) => void;
  handleExportConfirm: () => Promise<void>;

  // 1. Khoảng thời gian
  collectedFromDate: string;
  setCollectedFromDate: (date: string) => void;
  collectedToDate: string;
  setCollectedToDate: (date: string) => void;

  // 2. Chọn nhiều người (Mảng string)
  selectedCollectedUsers: string[];
  setSelectedCollectedUsers: (userIds: string[]) => void;

  selectedUsers: string[];
  setSelectedUsers: (userIds: string[]) => void;

  // 3. Các trạng thái
  collectedStatus: string;
  setCollectedStatus: (status: string) => void;
  closingStatus: string;
  setClosingStatus: (status: string) => void;

  collectionStatus: string;
  setCollectionStatus: (status: string) => void;
  paymentStatus: string;
  setPaymentStatus: (status: string) => void;
}

export default function ExportModals({
  userData,

  // Export By User
  openExportByUser,
  selectedExportUser,
  setOpenExportByUser,
  setSelectedExportUser,
  handleExportByUserConfirm,

  // Export Collected
  openExportCollected,
  setOpenExportCollected,
  handleExportCollectedConfirm,

  collectedFromDate,
  setCollectedFromDate,
  collectedToDate,
  setCollectedToDate,
  selectedCollectedUsers,
  setSelectedCollectedUsers,
  collectedStatus,
  setCollectedStatus,
  closingStatus,
  setClosingStatus,

  openExportModal,
  setOpenExportModal,
  handleExportConfirm,
  selectedUsers,
  setSelectedUsers,
  collectionStatus,
  setCollectionStatus,
  paymentStatus,
  setPaymentStatus,
}: ExportModalsProps) {
    const [filterProvince, setFilterProvince] = useState<string>("Đồng Tháp");

  const filteredUsers = useMemo(() => {
    if (filterProvince === "ALL") return userData;
    return userData.filter((u) => u.province === filterProvince);
  }, [userData, filterProvince]);

  const provinces = useMemo(() => {
    const list = userData.map((u) => u.province).filter(Boolean);
    return Array.from(new Set(list));
  }, [userData]);

  const isAllSelected = filteredUsers.length > 0 && selectedCollectedUsers.length === filteredUsers.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCollectedUsers([]);
    } else {
      setSelectedCollectedUsers(filteredUsers.map((u) => u._id));
    }
  };

  useEffect(() => {
    if (filteredUsers.length > 0) {
      const allIds = filteredUsers.map((u) => u._id);
      setSelectedCollectedUsers(allIds);
    } else {
      setSelectedCollectedUsers([]);
    }
  }, [filteredUsers, setSelectedCollectedUsers]);

  return (
    <>
      {/* Modal Export By User */}
      <Dialog open={openExportByUser} onClose={() => setOpenExportByUser(false)}>
        <DialogTitle>Chọn Người Phụ Trách</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Người phụ trách</InputLabel>
            <Select
              value={selectedExportUser}
              label="Người phụ trách"
              onChange={(e) => setSelectedExportUser(e.target.value)}
            >
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportByUser(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleExportByUserConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Export Collected */}
      <Dialog open={openExportCollected} onClose={() => setOpenExportCollected(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            paddingBottom: 0,
            borderBottom: "1px solid #eee",
          }}
        >
          Xuất Excel Hóa Đơn Chọn Lọc
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "16px !important" }}>
          {/* <FormControl component="fieldset">
            <RadioGroup
              row
              name="dateFilterType"
              value={dateFilterType}
              onChange={(e) => {
                const newType = e.target.value;
                setDateFilterType(newType);

                setCollectedFromDate(collectedFromDate);
                setCollectedToDate(collectedFromDate);
              }}
            >
              <FormControlLabel value="single" control={<Radio size="small" />} label="Một ngày cụ thể" />
              <FormControlLabel value="range" control={<Radio size="small" />} label="Khoảng thời gian" />
            </RadioGroup>
          </FormControl> */}

          {/* {dateFilterType === "single" ? (
            <TextField
              label="Chọn ngày"
              type="date"
              fullWidth
              margin="dense"
              value={collectedFromDate}
              onChange={(e) => {
                setCollectedFromDate(e.target.value);
                setCollectedToDate(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              helperText="Chọn ngày cần xuất báo cáo"
            />
          ) : ( */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
            <TextField
              label="Từ ngày"
              type="date"
              fullWidth
              margin="dense"
              value={collectedFromDate}
              onChange={(e) => setCollectedFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Đến ngày"
              type="date"
              fullWidth
              margin="dense"
              value={collectedToDate}
              onChange={(e) => setCollectedToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <div style={{ marginTop: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
            <FormControl fullWidth margin="dense" size="small" sx={{ marginBottom: "12px" }}>
              <InputLabel>Lọc theo Tỉnh/Thành phố</InputLabel>
              <Select
                value={filterProvince}
                label="Lọc theo Tỉnh/Thành phố"
                onChange={(e) => {
                  setFilterProvince(e.target.value);
                  setSelectedCollectedUsers([]);
                }}
              >
                <MenuItem value="ALL">
                  <p>-- Tất cả khu vực --</p>
                </MenuItem>
                {provinces.map((prov) => (
                  <MenuItem key={prov} value={prov}>
                    {prov}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Chọn nhiều người phụ trách */}
            <FormControl fullWidth margin="dense">
              <InputLabel shrink={openExportCollected || selectedCollectedUsers.length > 0}>
                Người phụ trách ({filterProvince === "ALL" ? "Toàn quốc" : filterProvince})
              </InputLabel>
              <Select
                multiple
                displayEmpty
                value={selectedCollectedUsers}
                label="Người phụ trách (Toàn quốc)"
                onChange={(e) => {
                  const val = e.target.value;
                  // Chỉ set giá trị nếu nó là array chuỗi ID (tránh lỗi conflict với nút Select All)
                  if (Array.isArray(val) && !val.includes("SELECT_ALL_OPTION")) {
                    setSelectedCollectedUsers(val);
                  }
                }}
                renderValue={(selected) => {
                  if (selected.length === 0) return <span style={{ color: "#999" }}>Chưa chọn người nào</span>;
                  if (selected.length === filteredUsers.length && filteredUsers.length > 0)
                    return <strong>Đã chọn tất cả ({selected.length})</strong>;

                  const names = selected.map((id) => userData.find((u) => u._id === id)?.fullName);
                  return names.length > 3
                    ? `${names.slice(0, 3).join(", ")}... (+${names.length - 3})`
                    : names.join(", ");
                }}
              >
                <MenuItem
                  value="SELECT_ALL_OPTION"
                  onClick={handleSelectAll}
                  sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}
                >
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={
                      selectedCollectedUsers.length > 0 && selectedCollectedUsers.length < filteredUsers.length
                    }
                  />
                  <ListItemText primary={isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả danh sách dưới"} />
                </MenuItem>

                {/* DANH SÁCH USER ĐÃ ĐƯỢC LỌC */}
                {filteredUsers.length === 0 ? (
                  <MenuItem disabled>
                    <em style={{ fontSize: 13 }}>Không có nhân sự tại khu vực này</em>
                  </MenuItem>
                ) : (
                  filteredUsers.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      <Checkbox checked={selectedCollectedUsers.indexOf(user._id) > -1} />
                      <ListItemText primary={user.fullName} secondary={user.province} />{" "}
                      {/* Hiển thị thêm tỉnh cho rõ */}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </div>

          {/* 2. Chọn nhiều người phụ trách */}
          {/* <FormControl fullWidth margin="dense">
            <InputLabel shrink={openExportCollected || selectedCollectedUsers.length > 0}>Người phụ trách</InputLabel>
            <Select
              multiple
              displayEmpty
              value={selectedCollectedUsers}
              label="Người phụ trách"
              onChange={(e) =>
                setSelectedCollectedUsers(
                  typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value
                )
              }
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <p>Tất cả người phụ trách</p>;
                }
                return selected.map((id) => userData.find((u) => u._id === id)?.fullName).join(", ");
              }}
            >
              {userData.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <Checkbox checked={selectedCollectedUsers.indexOf(user._id) > -1} />
                  <ListItemText primary={user.fullName} />
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}

          {/* 3. Chọn trạng thái (2 ô nằm ngang) */}
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            {/* Trạng thái thu */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Trạng thái thu</InputLabel>
              <Select
                value={collectedStatus}
                label="Trạng thái thu"
                onChange={(e) => setCollectedStatus(e.target.value)}
              >
                <MenuItem value="paid">Đã thu</MenuItem>
                <MenuItem value="unpaid">Chưa thu</MenuItem>
                <MenuItem value="all">Tất cả</MenuItem>
              </Select>
            </FormControl>

            {/* Trạng thái đóng cước */}
            <FormControl fullWidth margin="dense">
              <InputLabel>Đóng cước</InputLabel>
              <Select value={closingStatus} label="Đóng cước" onChange={(e) => setClosingStatus(e.target.value)}>
                <MenuItem value="true">Đã đóng</MenuItem>
                <MenuItem value="false">Chưa đóng</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportCollected(false)}>Hủy</Button>
          <Button variant="contained" color="success" onClick={handleExportCollectedConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL XUẤT EXCEL */}
      <Dialog open={openExportModal} onClose={() => setOpenExportModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}>Xuất Excel toàn bộ</DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* 1. Chọn Người phụ trách (Multiple) */}
            <FormControl fullWidth size="small">
              <InputLabel>Người phụ trách</InputLabel>
              <Select
                multiple
                value={selectedUsers}
                label="Người phụ trách"
                onChange={(e) => {
                  const {
                    target: { value },
                  } = e;

                  setSelectedUsers(typeof value === "string" ? value.split(",") : value);
                }}
                renderValue={(selected) => {
                  if (selected.length === 0) return "Tất cả";
                  return `Đã chọn ${selected.length} người`;
                }}
              >
                {userData.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    <Checkbox checked={selectedUsers.indexOf(user._id) > -1} />
                    <ListItemText primary={user.fullName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 2. Trạng thái thu */}
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái thu</InputLabel>
              <Select
                value={collectionStatus}
                label="Trạng thái thu"
                onChange={(e) => setCollectionStatus(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="paid">Đã thu</MenuItem>
                <MenuItem value="unpaid">Chưa thu</MenuItem>
              </Select>
            </FormControl>

            {/* 3. Trạng thái đóng cước */}
            <FormControl fullWidth size="small">
              <InputLabel>Đóng cước</InputLabel>
              <Select value={paymentStatus} label="Đóng cước" onChange={(e) => setPaymentStatus(e.target.value)}>
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="true">Đã đóng</MenuItem>
                <MenuItem value="false">Chưa đóng</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f9f9f9" }}>
          <Button onClick={() => setOpenExportModal(false)} color="inherit">
            Hủy
          </Button>
          <Button variant="contained" color="success" onClick={handleExportConfirm}>
            Báo cáo Excel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

