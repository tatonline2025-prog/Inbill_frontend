import React from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Button,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  AccountBalance as BankIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  CreditCard as CardIcon,
} from "@mui/icons-material";
import { ITransactionPaymentBank } from "@/types/transaction";
import toast from "react-hot-toast";

interface Props {
  banks: ITransactionPaymentBank[];
  loading: boolean;
  onAddBank: () => void;
  onReload: () => void;
  onEditBank: (bank: ITransactionPaymentBank) => void;
}

export default function BankListCard({ banks, loading, onAddBank, onReload, onEditBank }: Props) {
  const theme = useTheme();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép số tài khoản!");
  };

  const handleEditClick = (bank: ITransactionPaymentBank) => {
    onEditBank(bank);
  };

  return (
    <Card
      elevation={3}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* --- HEADER --- */}
      <Box
        sx={{
          p: 2,
          gap: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "primary.main",
              width: 40,
              height: 40,
              boxShadow: 2,
            }}
          >
            <BankIcon fontSize="small" />
          </Avatar>
          <Box>
            {/* Sử dụng variant h6 cho tiêu đề chính thay vì chỉnh font weight thủ công */}
            <Typography variant="h6" component="div">
              Hình thức thanh toán
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý hình thức thanh toán
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="contained"
          onClick={onAddBank}
          startIcon={<AddIcon />}
          sx={{ textTransform: "none", borderRadius: 2, boxShadow: "none" }}
        >
          Thêm mới
        </Button>
      </Box>

      {/* --- CONTENT --- */}
      <CardContent sx={{ p: 0, flexGrow: 1, position: "relative", minHeight: 300 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : (
          <List sx={{ p: 2, maxHeight: 350, overflowY: "auto" }}>
            {banks.length === 0 ? (
              // --- EMPTY STATE ---
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  mt: 4,
                  opacity: 0.6,
                }}
              >
                <CardIcon sx={{ fontSize: 60, color: "action.disabled", mb: 2 }} />
                <Typography variant="body1" color="text.secondary" align="center">
                  Chưa có tài khoản nào.
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Nhấn Thêm mới để bắt đầu nhận thanh toán.
                </Typography>
              </Box>
            ) : (
              banks.map((bank) => (
                <ListItem
                  key={bank._id}
                  sx={{
                    mb: 1.5,
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: theme.shadows[2],
                      transform: "translateY(-2px)",
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Chỉnh sửa thông tin">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleEditClick(bank)} // Kích hoạt chỉnh sửa
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Sao chép hình thức thanh toán">
                        <IconButton edge="end" size="small" onClick={() => handleCopy(bank.bankName)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: "success.main",
                      }}
                    >
                      <CardIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      // Dùng subtitle1 thay cho body1 + fontWeight bold
                      <Typography variant="subtitle1" color="text.primary">
                        {bank.bankName}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
