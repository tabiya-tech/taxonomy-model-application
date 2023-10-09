import { Button, ButtonProps } from "@mui/material";
import React from "react";

interface PrimaryButtonProps extends ButtonProps {
  // Add additional props specific to PrimaryButton Button here
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ style, children, ...props }) => {
  return (
    // props are passed to the component last, so that they can override the default values
    <Button
      variant={"contained"}
      color={"primary"}
      style={style}
      sx={{ borderRadius: (theme) => theme.tabiyaRounding.xl }}
      disableElevation
      {...props}
    >
      {children ?? "Click here"}
    </Button>
  );
};

export default PrimaryButton;
