import React from "react";
import { Box, CircularProgress } from "@mui/material";

const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
};

export default Spinner;
