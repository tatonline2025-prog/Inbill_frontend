"use client";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useEffect, useState } from "react";
import { IUser } from "@/types/user";
import { fetchCollaborators } from "@/services/transaction";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (filter: { type: string; date: string; collaborator: string; collaboratorName: string }) => void;
  currentUser: IUser | null;
  isAdmin: boolean;
}

export default function ExportTransactionModal({ open, onClose, onExport, currentUser, isAdmin }: ExportModalProps) {
  const [exportScope, setExportScope] = useState("ALL_DATE"); // ALL_DATE hoặc SPECIFIC_DATE
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("all");
  const [selectedCollaboratorName, setSelectedCollaboratorName] = useState("");
  const [collaboratorList, setCollaboratorList] = useState<IUser[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  useEffect(() => {
    if (open) {
      if (isAdmin) {
        // --- TRƯỜNG HỢP ADMIN: Fetch danh sách ---
        // Nếu chưa có list thì mới fetch để tránh fetch lại nhiều lần
        if (collaboratorList.length === 0) {
          setLoadingCollaborators(true);
          fetchCollaborators()
            .then((list) => {
              // Option "Tất cả" cho Admin
              const allOption: Partial<IUser> = { _id: "all", fullName: "Tất cả Cộng Tác Viên", email: "" };
              // Giả sử API trả về { users: [...] } hoặc mảng trực tiếp, bạn chỉnh lại cho khớp response
              const users = list.users || list;
              const final = [allOption, ...users.filter((c: IUser) => c._id !== "all")];

              setCollaboratorList(final);
              setLoadingCollaborators(false);
            })
            .catch(() => setLoadingCollaborators(false));
        }
      } else {
        // --- TRƯỜNG HỢP CTV THƯỜNG: Chỉ hiện chính mình ---
        if (currentUser) {
          setCollaboratorList([currentUser]);
          setSelectedCollaboratorId(currentUser._id);
          setSelectedCollaboratorName(currentUser.fullName);
        }
      }
    }
  }, [open, isAdmin, currentUser]);

  const handleExportClick = () => {
    const finalCollaboratorId = selectedCollaboratorId === "all" ? "" : selectedCollaboratorId;

    let finalCollaboratorName = "Tất cả CTV";

    if (!isAdmin) {
      finalCollaboratorName = currentUser?.fullName || "Người dùng hiện tại";
    } else if (selectedCollaboratorId !== "all") {
      const selectedUser = collaboratorList.find((c) => c._id === selectedCollaboratorId);
      finalCollaboratorName = selectedUser?.fullName || "CTV không xác định";
    }

    onExport({
      type: exportScope,
      date: exportScope === "SPECIFIC_DATE" ? selectedDate : "",
      collaborator: finalCollaboratorId, // Truyền ID CTV đã chọn
      collaboratorName: finalCollaboratorName,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <DownloadIcon color="primary" /> Xuất Báo Cáo Excel
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* 1. Chọn Cộng Tác Viên */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              1. Chọn Cộng tác viên
            </Typography>
            {loadingCollaborators ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <TextField
                select // 👈 Biến TextField thành Select/Dropdown
                fullWidth
                label="Cộng tác viên"
                value={selectedCollaboratorId}
                onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                disabled={!isAdmin}
                helperText={
                  isAdmin ? "Chọn CTV bạn muốn xuất báo cáo. Mặc định: Tất cả." : "Xuất báo cáo của chính mình."
                }
              >
                {collaboratorList.map((ctv) => (
                  <MenuItem key={ctv._id} value={ctv._id}>
                    {
                      ctv._id === "all"
                        ? ctv.fullName // "Tất cả Cộng Tác Viên"
                        : `${ctv.fullName} (${ctv.email || ctv._id})` // Tên (Mã CTV)
                    }
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          {/* 2. Chọn Thời gian */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              2. Thời gian xuất hoá đơn
            </Typography>
            <FormControl>
              <RadioGroup value={exportScope} onChange={(e) => setExportScope(e.target.value)}>
                <FormControlLabel value="ALL_DATE" control={<Radio />} label="Toàn bộ thời gian (Tất cả lịch sử)" />
                <FormControlLabel value="SPECIFIC_DATE" control={<Radio />} label="Chọn theo ngày cụ thể" />
              </RadioGroup>
            </FormControl>

            {exportScope === "SPECIFIC_DATE" && (
              <Box sx={{ mt: 2, ml: 4 }}>
                <TextField
                  type="date"
                  fullWidth
                  label="Chọn ngày"
                  InputLabelProps={{ shrink: true }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Hủy bỏ
        </Button>
        <Button onClick={handleExportClick} variant="contained" color="success" startIcon={<DownloadIcon />}>
          Xuất Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
