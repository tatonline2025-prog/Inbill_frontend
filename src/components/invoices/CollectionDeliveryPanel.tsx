"use client";

import { useState } from "react";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import RefreshIcon from "@mui/icons-material/Refresh";
import TelegramIcon from "@mui/icons-material/Telegram";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";

import { formatDateTimeVN, toDateKeyVN } from "@/lib/date-vn";
import {
  fetchCollectionDeliverySummaryAPI,
  ICollectionDeliveryItem,
  ICollectionDeliverySummary,
  replayCollectionDeliveryAPI,
} from "@/services/invoice.api";
import { IUser } from "@/types/user";

type CollectionDeliveryPanelProps = {
  users: IUser[];
};

const formatCount = (value: number) => value.toLocaleString("vi-VN");

const getStatusChip = (status: string) => {
  if (status === "sent") {
    return <Chip label="Da gui" color="success" size="small" />;
  }
  if (status === "failed") {
    return <Chip label="Loi" color="error" size="small" />;
  }
  if (status === "sending") {
    return <Chip label="Dang gui" color="warning" size="small" />;
  }
  return <Chip label="Chua gui" variant="outlined" size="small" />;
};

export default function CollectionDeliveryPanel({ users }: CollectionDeliveryPanelProps) {
  const [date, setDate] = useState(toDateKeyVN());
  const [assignedUserId, setAssignedUserId] = useState("all");
  const [summary, setSummary] = useState<ICollectionDeliverySummary | null>(null);
  const [items, setItems] = useState<ICollectionDeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetchCollectionDeliverySummaryAPI(date, assignedUserId);
      setSummary(response.data.summary);
      setItems(response.data.items);
      setHasLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error("Khong tai duoc doi soat da thu.");
    } finally {
      setLoading(false);
    }
  };

  const runReplay = async (
    actionKey: string,
    channel: "telegram" | "webhook" | "both",
    mode: "missing" | "force"
  ) => {
    try {
      setRunningAction(actionKey);
      const response = await replayCollectionDeliveryAPI({
        date,
        assignedUserId,
        channel,
        mode,
      });
      toast.success(response.data?.message || "Da gui yeu cau bo sung.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Bo sung doi soat that bai.");
    } finally {
      setRunningAction(null);
    }
  };

  const cards = summary
    ? [
        {
          label: "Da thu trong DB",
          value: summary.totalCollectedCount,
          color: "#111827",
          background: "#f3f4f6",
        },
        {
          label: "Telegram da gui",
          value: summary.telegramDeliveredCount,
          color: "#0f766e",
          background: "#ccfbf1",
        },
        {
          label: "Filter da ghi",
          value: summary.webhookDeliveredCount,
          color: "#1d4ed8",
          background: "#dbeafe",
        },
        {
          label: "Thieu Telegram",
          value: summary.missingTelegramCount,
          color: "#b45309",
          background: "#fef3c7",
        },
        {
          label: "Thieu Filter",
          value: summary.missingWebhookCount,
          color: "#b91c1c",
          background: "#fee2e2",
        },
      ]
    : [];

  return (
    <Paper elevation={0} sx={{ mt: 2, border: "1px solid #e5e7eb", borderRadius: 2, p: 2 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", lg: "flex-end" }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Doi soat da thu
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
            So sanh tong hoa don da thu trong ngay voi log Telegram va sheet Filter. Neu nghi sheet bi xoa
            tay hoac thieu dong, co the dong bo lai Filter cho ca ngay.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            size="small"
            type="date"
            label="Ngay"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            size="small"
            label="Nguoi phu trach"
            value={assignedUserId}
            onChange={(event) => setAssignedUserId(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">Tat ca</MenuItem>
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.fullName || user.username}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void load()}
            disabled={loading}
          >
            Tai lai
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : !hasLoaded ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Chon ngay va bam Tai lai de xem tong so da thu, so da gui Telegram va so da ghi vao Filter.
        </Alert>
      ) : (
        <>
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(1, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(5, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {cards.map((card) => (
              <Box
                key={card.label}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  backgroundColor: card.background,
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#6b7280", textTransform: "uppercase" }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>
                  {formatCount(card.value)}
                </Typography>
              </Box>
            ))}
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="info"
              startIcon={<TelegramIcon />}
              disabled={runningAction !== null || (summary?.missingTelegramCount || 0) === 0}
              onClick={() => void runReplay("telegram-missing", "telegram", "missing")}
            >
              {runningAction === "telegram-missing" ? "Dang bo sung..." : "Bu thieu Telegram"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AutorenewIcon />}
              disabled={runningAction !== null || (summary?.missingWebhookCount || 0) === 0}
              onClick={() => void runReplay("filter-missing", "webhook", "missing")}
            >
              {runningAction === "filter-missing" ? "Dang bo sung..." : "Bu thieu Filter"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={runningAction !== null || items.length === 0}
              onClick={() => void runReplay("filter-force", "webhook", "force")}
            >
              {runningAction === "filter-force" ? "Dang dong bo..." : "Dong bo lai Filter ngay nay"}
            </Button>
          </Stack>

          <Alert severity="info" sx={{ mt: 2 }}>
            Tong trong DB la so hoa don da duoc chon Da thu trong ngay. Telegram va Filter la so da gui
            thanh cong theo log. Neu nghi Filter thieu do xoa tay hoac webhook cu, bam
            {" "}Dong bo lai Filter ngay nay{" "}.
          </Alert>

          <TableContainer sx={{ mt: 2, border: "1px solid #e5e7eb", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Thoi diem thu</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ma KH</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nguoi phu trach</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ky TT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Telegram</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Filter</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#6b7280" }}>
                      Chua co hoa don da thu trong ngay duoc chon.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.eventKey} hover>
                      <TableCell>{item.collectionDateDisplay || "-"}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>{item.invoiceNumber || "-"}</Typography>
                        {item.recordBookCode ? (
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            Tram: {item.recordBookCode}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>{item.assignedToName || "-"}</TableCell>
                      <TableCell>{item.billingPeriod || "-"}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          {getStatusChip(item.telegramStatus)}
                          {item.telegramSentAt ? (
                            <Typography variant="caption" sx={{ color: "#6b7280" }}>
                              {formatDateTimeVN(item.telegramSentAt)}
                            </Typography>
                          ) : null}
                          {item.telegramError ? (
                            <Typography variant="caption" sx={{ color: "#dc2626" }}>
                              {item.telegramError}
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          {getStatusChip(item.webhookStatus)}
                          {item.webhookSentAt ? (
                            <Typography variant="caption" sx={{ color: "#6b7280" }}>
                              {formatDateTimeVN(item.webhookSentAt)}
                            </Typography>
                          ) : null}
                          {item.webhookError ? (
                            <Typography variant="caption" sx={{ color: "#dc2626" }}>
                              {item.webhookError}
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
}
