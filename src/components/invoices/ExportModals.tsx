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
import { useEffect, useMemo, useState } from "react";

import {
  compareAreaPrefixEntries,
  formatAreaPrefixLabel,
  getAreaPrefixKey,
  getPrimaryAreaPrefix,
} from "@/lib/area-prefix";
import { IUser } from "@/types/user";

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
  openExportByUser: boolean;
  selectedExportUser: string;
  setOpenExportByUser: (open: boolean) => void;
  setSelectedExportUser: (userId: string) => void;
  handleExportByUserConfirm: () => Promise<void>;
  openExportCollected: boolean;
  setOpenExportCollected: (open: boolean) => void;
  handleExportCollectedConfirm: () => Promise<void>;
  openExportModal: boolean;
  setOpenExportModal: (open: boolean) => void;
  handleExportConfirm: () => Promise<void>;
  collectedFromDate: string;
  setCollectedFromDate: (date: string) => void;
  collectedToDate: string;
  setCollectedToDate: (date: string) => void;
  selectedCollectedUsers: string[];
  setSelectedCollectedUsers: (userIds: string[]) => void;
  selectedUsers: string[];
  setSelectedUsers: (userIds: string[]) => void;
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
  openExportByUser,
  selectedExportUser,
  setOpenExportByUser,
  setSelectedExportUser,
  handleExportByUserConfirm,
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
  const [filterAreaKey, setFilterAreaKey] = useState<string>("ALL");

  const areaOptions = useMemo(() => {
    const uniqueOptions = new Map<string, ReturnType<typeof getPrimaryAreaPrefix>>();
    userData.forEach((user) => {
      const primary = getPrimaryAreaPrefix(user);
      uniqueOptions.set(getAreaPrefixKey(primary), primary);
    });

    return Array.from(uniqueOptions.entries()).sort(([, left], [, right]) => compareAreaPrefixEntries(left, right));
  }, [userData]);

  const filteredUsers = useMemo(() => {
    if (filterAreaKey === "ALL") return userData;
    return userData.filter((user) => getAreaPrefixKey(getPrimaryAreaPrefix(user)) === filterAreaKey);
  }, [filterAreaKey, userData]);

  const areaLabel =
    filterAreaKey === "ALL"
      ? "Tất cả khu vực"
      : formatAreaPrefixLabel(areaOptions.find(([value]) => value === filterAreaKey)?.[1]);

  const isAllSelected = filteredUsers.length > 0 && selectedCollectedUsers.length === filteredUsers.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCollectedUsers([]);
      return;
    }
    setSelectedCollectedUsers(filteredUsers.map((user) => user._id));
  };

  useEffect(() => {
    if (filteredUsers.length > 0) {
      setSelectedCollectedUsers(filteredUsers.map((user) => user._id));
    } else {
      setSelectedCollectedUsers([]);
    }
  }, [filteredUsers, setSelectedCollectedUsers]);

  return (
    <>
      <Dialog open={openExportByUser} onClose={() => setOpenExportByUser(false)}>
        <DialogTitle>Chọn Người Phụ Trách</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Người phụ trách</InputLabel>
            <Select
              value={selectedExportUser}
              label="Người phụ trách"
              onChange={(event) => setSelectedExportUser(event.target.value)}
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
          <Button onClick={() => setOpenExportByUser(false)}>Huỷ</Button>
          <Button variant="contained" color="success" onClick={handleExportByUserConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openExportCollected} onClose={() => setOpenExportCollected(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ paddingBottom: 0, borderBottom: "1px solid #eee" }}>
          Xuất Excel Hóa Đơn Chọn Lọc
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "16px !important" }}>
          <div style={{ display: "flex", gap: "16px", marginBottom: "8px", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <TextField
                label="Từ"
                type="date"
                fullWidth
                margin="dense"
                value={collectedFromDate}
                onChange={(event) => setCollectedFromDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <span style={{ color: "#666", fontSize: "0.85rem", whiteSpace: "nowrap", marginRight: 6 }}>
                      00:00
                    </span>
                  ),
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Đến"
                type="date"
                fullWidth
                margin="dense"
                value={collectedToDate}
                onChange={(event) => setCollectedToDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <span style={{ color: "#666", fontSize: "0.85rem", whiteSpace: "nowrap", marginRight: 6 }}>
                      23:59
                    </span>
                  ),
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
            <FormControl fullWidth margin="dense" size="small" sx={{ marginBottom: "12px" }}>
              <InputLabel>Lọc theo Xã/Phường</InputLabel>
              <Select
                value={filterAreaKey}
                label="Lọc theo Xã/Phường"
                onChange={(event) => {
                  setFilterAreaKey(event.target.value);
                  setSelectedCollectedUsers([]);
                }}
              >
                <MenuItem value="ALL">-- Tất cả khu vực --</MenuItem>
                {areaOptions.map(([value, entry]) => (
                  <MenuItem key={value} value={value}>
                    {formatAreaPrefixLabel(entry)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <FormControl fullWidth margin="dense" sx={{ flex: 1 }}>
                <InputLabel shrink={openExportCollected || selectedCollectedUsers.length > 0}>
                  Người phụ trách ({areaLabel})
                </InputLabel>
                <Select
                  multiple
                  displayEmpty
                  value={selectedCollectedUsers}
                  label="Người phụ trách"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (Array.isArray(value) && !value.includes("SELECT_ALL_OPTION")) {
                      setSelectedCollectedUsers(value);
                    }
                  }}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <span style={{ color: "#999" }}>Chưa chọn người nào</span>;
                    }
                    if (selected.length === filteredUsers.length && filteredUsers.length > 0) {
                      return <strong>Đã chọn tất cả ({selected.length})</strong>;
                    }

                    const names = selected.map((id) => userData.find((user) => user._id === id)?.fullName);
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

                  {filteredUsers.length === 0 ? (
                    <MenuItem disabled>
                      <em style={{ fontSize: 13 }}>Không có người phụ trách ở khu vực này</em>
                    </MenuItem>
                  ) : (
                    filteredUsers.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        <Checkbox checked={selectedCollectedUsers.indexOf(user._id) > -1} />
                        <ListItemText
                          primary={user.fullName}
                          secondary={formatAreaPrefixLabel(getPrimaryAreaPrefix(user))}
                        />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="dense" sx={{ flex: 1 }}>
                <InputLabel>Trạng thái hóa đơn</InputLabel>
                <Select
                  value={collectedStatus}
                  label="Trạng thái hóa đơn"
                  onChange={(event) => setCollectedStatus(event.target.value)}
                >
                  <MenuItem value="paid">Đã thu</MenuItem>
                  <MenuItem value="unpaid">Chưa thu</MenuItem>
                  <MenuItem value="closed">Đã đóng cước</MenuItem>
                  <MenuItem value="all">Tất cả</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportCollected(false)}>Huỷ</Button>
          <Button variant="contained" color="success" onClick={handleExportCollectedConfirm}>
            Xuất Excel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openExportModal} onClose={() => setOpenExportModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}>Xuất Excel toàn bộ</DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Người phụ trách</InputLabel>
              <Select
                multiple
                value={selectedUsers}
                label="Người phụ trách"
                onChange={(event) => {
                  const {
                    target: { value },
                  } = event;
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
                    <ListItemText primary={user.fullName} secondary={formatAreaPrefixLabel(getPrimaryAreaPrefix(user))} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái thu</InputLabel>
              <Select
                value={collectionStatus}
                label="Trạng thái thu"
                onChange={(event) => setCollectionStatus(event.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="paid">Đã thu</MenuItem>
                <MenuItem value="unpaid">Chưa thu</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Đóng cước</InputLabel>
              <Select
                value={paymentStatus}
                label="Đóng cước"
                onChange={(event) => setPaymentStatus(event.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="true">Đã đóng</MenuItem>
                <MenuItem value="false">Chưa đóng</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "#f9f9f9" }}>
          <Button onClick={() => setOpenExportModal(false)} color="inherit">
            Huỷ
          </Button>
          <Button variant="contained" color="success" onClick={handleExportConfirm}>
            Báo cáo Excel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
