"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, List, ListItemButton, ListItemText, Pagination, Stack, Typography } from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTimeVN } from "@/lib/date-vn";
import { AdminActivityItem, fetchAdminActivities, markAdminActivityRead } from "@/services/adminActivity.api";

export default function AdminNotifications() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminActivityItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    const load = async () => {
      try {
        const data = await fetchAdminActivities(open ? page : 1, open ? 20 : 1);
        if (!active) return;
        setUnread(data.unreadCount);
        if (open) { setItems(data.items); setTotal(data.total); }
        setError("");
      } catch {
        if (active && open) setError("Không tải được thông báo. Bạn có thể bấm Tải lại.");
      }
    };
    void load();
    const onFocus = () => { if (!document.hidden) void load(); };
    const timer = setInterval(onFocus, 30_000);
    window.addEventListener("focus", onFocus);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [user?._id, user?.role, open, page, refresh]);

  const markRead = async (id: string) => {
    try { await markAdminActivityRead(id); setRefresh((value) => value + 1); }
    catch { setError("Không đánh dấu được thông báo đã đọc."); }
  };
  if (user?.role !== "admin") return null;

  return <>
    <IconButton aria-label={`Thông báo admin, ${unread} chưa đọc`} onClick={() => { setPage(1); setOpen(true); }} sx={{ color: "inherit" }}>
      <Badge badgeContent={unread} color="error" max={99}><NotificationsOutlinedIcon /></Badge>
    </IconButton>
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Thông báo từ user {unread > 0 ? `(${unread} chưa đọc)` : ""}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {items.length === 0 && !error && <Typography sx={{ p: 3 }} color="text.secondary">Chưa có thao tác mới từ user.</Typography>}
        <List disablePadding sx={{ maxHeight: "55vh", overflowY: "auto" }}>
          {items.map((item) => {
            const isUnread = !item.readBy.includes(user._id);
            return <Box key={item._id} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: isUnread ? "action.selected" : "transparent" }}>
              <ListItemButton onClick={() => {
                setExpanded((value) => value === item._id ? null : item._id);
                if (isUnread) void markRead(item._id);
              }}>
                <ListItemText
                  primary={`${item.actorName} — ${item.title}`}
                  primaryTypographyProps={{ fontWeight: isUnread ? 700 : 500 }}
                  secondary={<>{item.message}<br />{formatDateTimeVN(item.createdAt)}</>}
                />
              </ListItemButton>
              <Collapse in={expanded === item._id}>
                <Stack spacing={0.5} sx={{ px: 2, pb: 2 }}>
                  <Typography variant="body2">Tài khoản: {item.actorUsername || item.actorName}</Typography>
                  {item.customerCode && <Typography variant="body2">Mã KH: {item.customerCode}</Typography>}
                  {item.details.fileName && <Typography variant="body2">File: {item.details.fileName}</Typography>}
                  {item.details.billingPeriod && <Typography variant="body2">Kỳ: {item.details.billingPeriod}</Typography>}
                  {item.details.totalAmount && <Typography variant="body2">Tổng tiền: {Number(item.details.totalAmount).toLocaleString("vi-VN")}</Typography>}
                  {item.details.customerCodes?.length ? <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>Mã KH trong file: {item.details.customerCodes.join(", ")}{item.count > item.details.customerCodes.length ? "…" : ""}</Typography> : null}
                  {item.changes.map((change) => <Typography key={change.field} variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {change.label}: {change.before || "(trống)"} → {change.after || "(trống)"}
                  </Typography>)}
                </Stack>
              </Collapse>
            </Box>;
          })}
        </List>
        {total > 20 && <Pagination sx={{ display: "flex", justifyContent: "center", p: 1 }} page={page} count={Math.ceil(total / 20)} onChange={(_, next) => setPage(next)} size="small" />}
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap" }}>
        <Button onClick={() => setRefresh((value) => value + 1)}>Tải lại</Button>
        <Button disabled={unread === 0} onClick={() => void markRead("all")}>Đánh dấu tất cả đã đọc</Button>
        <Button onClick={() => setOpen(false)}>Đóng</Button>
      </DialogActions>
    </Dialog>
  </>;
}
