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
  useTheme,
  alpha,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Category as CategoryIcon,
  Add as AddIcon,
  Label as LabelIcon,
  LocalOffer as TagIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { ITransactionType } from "@/types/transaction";

interface Props {
  types: ITransactionType[];
  loading: boolean;
  onAddType: () => void;
  onEditType: (type: ITransactionType) => void;
  onReload: () => void;
  onDeleteType: (typeId: string) => void;
}

export default function TransactionTypeListCard({
  types,
  loading,
  onAddType,
  onEditType,
  onReload,
  onDeleteType,
}: Props) {
  const theme = useTheme();

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
            <CategoryIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              Loại Giao Dịch
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phân loại các khoản thu chi
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="contained"
          onClick={onAddType}
          startIcon={<AddIcon />}
          sx={{ textTransform: "none", borderRadius: 2, boxShadow: "none" }}
        >
          Tạo mới
        </Button>
      </Box>

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
            {types.length === 0 ? (
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
                <TagIcon sx={{ fontSize: 60, color: "action.disabled", mb: 2 }} />
                <Typography variant="body1" color="text.secondary" align="center">
                  Chưa có loại giao dịch nào.
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Tạo các loại (ví dụ: Ăn uống, Lương) để quản lý.
                </Typography>
              </Box>
            ) : (
              types.map((type) => (
                <ListItem
                  key={type._id}
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
                      <Tooltip title="Chỉnh sửa loại giao dịch">
                        <IconButton edge="end" size="small" onClick={() => onEditType(type)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Xóa (Tùy chọn)">
                        <IconButton edge="end" size="small" color="error" onClick={() => onDeleteType(type._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: "secondary.main",
                        width: 36,
                        height: 36,
                      }}
                    >
                      <LabelIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    sx={{ pr: 12 }}
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle2" color="text.primary">
                          {type.name}
                        </Typography>

                        {typeof type.discountPercent === "number" && (
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              px: 0.5,
                              borderRadius: 0.5,
                              fontWeight: "bold",
                            }}
                          >
                            {type.discountPercent}%
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {type.description || "Không có mô tả"}
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
