import React, { useContext } from "react";
import { IconButton, IconButtonProps, styled } from "@mui/material";
import { IsOnlineContext } from "src/app/providers";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";

interface PrimaryIconButtonProps extends IconButtonProps {
  disableWhenOffline?: boolean;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.spacing(theme.tabiyaSpacing.sm),
  lineHeight: "0",
  padding: 0,
  color: theme.palette.primary.main,
  ":hover": {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
  },
  ":active": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

const PrimaryIconButton: React.FC<PrimaryIconButtonProps> = ({
  children,
  disabled,
  disableWhenOffline,
  ...props
}: Readonly<PrimaryIconButtonProps>) => {
  const isOnline = useContext(IsOnlineContext);

  return (
    <StyledIconButton color={"primary"} disabled={Boolean(disabled || (disableWhenOffline && !isOnline))} {...props}>
      {children ?? <CircleOutlinedIcon sx={{ padding: 0, margin: 0 }} />}
    </StyledIconButton>
  );
};

export default PrimaryIconButton;
