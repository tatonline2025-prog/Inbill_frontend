"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingComponent({ message = "Đang tải dữ liệu..." }) {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
      }}
    >
      <CircularProgress color="primary" />
      <Typography variant="body1" sx={{ color: "#555" }}>
        {message}
      </Typography>
    </Box>
  );
}
