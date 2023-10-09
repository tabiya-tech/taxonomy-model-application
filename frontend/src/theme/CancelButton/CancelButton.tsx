import { Button, ButtonProps } from "@mui/material";
import React from "react";

interface CancelButtonProps extends ButtonProps {
  // Add additional props specific to Cancel Button here
}

const CancelButton: React.FC<CancelButtonProps> = ({ style, children, ...props }) => {
  return (
    // props are passed to the component last, so that they can override the default values
    <Button
      variant={"outlined"}
      color={"primary"}
      style={style}
      sx={{ borderRadius: (theme) => theme.tabiyaRounding.xl }}
      disableElevation
      {...props}
    >
      {children ?? "Cancel"}
    </Button>
  );
};

export default CancelButton;
