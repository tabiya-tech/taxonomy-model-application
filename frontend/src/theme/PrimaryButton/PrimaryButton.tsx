import { Button, ButtonProps } from "@mui/material";
import React, { useContext } from "react";
import { IsOnlineContext } from "src/app/providers";

interface PrimaryButtonProps extends ButtonProps {
  // Add additional props specific to PrimaryButton Button here
  disableWhenOffline?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  style,
  disabled,
  children,
  disableWhenOffline,
  ...props
}: Readonly<PrimaryButtonProps>) => {
  const isOnline = useContext(IsOnlineContext);

  return (
    // props are passed to the component last, so that they can override the default values
    <Button
      variant={"contained"}
      color={"primary"}
      style={style}
      sx={{ borderRadius: (theme) => theme.tabiyaRounding.xl }}
      disableElevation
      disabled={Boolean(disabled || (disableWhenOffline && !isOnline))}
      {...props}
    >
      {children ?? "Click here"}
    </Button>
  );
};

export default PrimaryButton;
