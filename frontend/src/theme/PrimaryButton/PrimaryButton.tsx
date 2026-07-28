import { Button, ButtonProps, Theme } from "@mui/material";
import React, { useContext } from "react";
import { IsOnlineContext } from "src/app/providers";

interface PrimaryButtonProps extends ButtonProps {
  // Add additional props specific to PrimaryButton Button here
  disableWhenOffline?: boolean;
}

export const getOutlinedButtonSx = (theme: Theme, variant: ButtonProps["variant"], color: ButtonProps["color"]) => {
  const isPrimaryOrSecondary = color === "primary" || color === "secondary";
  const paletteColor = isPrimaryOrSecondary ? color : undefined;
  if (variant !== "outlined" || !paletteColor) {
    return {};
  }
  const mainColor = theme.palette[paletteColor].main;
  return {
    border: `1px solid ${mainColor}`,
    "&:hover": {
      backgroundColor: `color-mix(in srgb, ${mainColor} 20%, transparent)`,
    },
  };
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  style,
  disabled,
  children,
  disableWhenOffline,
  variant = "contained",
  color = "primary",
  sx,
  ...props
}: Readonly<PrimaryButtonProps>) => {
  const isOnline = useContext(IsOnlineContext);

  return (
    // props are passed to the component last, so that they can override the default values
    <Button
      variant={variant}
      color={color}
      style={style}
      sx={[
        (theme: Theme) => ({
          borderRadius: theme.tabiyaRounding.xl,
          ...getOutlinedButtonSx(theme, variant, color),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      disableElevation
      disabled={Boolean(disabled || (disableWhenOffline && !isOnline))}
      {...props}
    >
      {children ?? "Click here"}
    </Button>
  );
};

export default PrimaryButton;
