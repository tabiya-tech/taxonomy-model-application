import React from "react";
import { IconButton, IconButtonProps, styled } from "@mui/material";

interface CustomIconButtonProps extends IconButtonProps {
  handleClick: () => void;
  icon: React.ReactNode;
  disabled: boolean;
  ariaLabel: string;
}

const uniqueId = "ae03cd99-e992-4313-8a8e-56f567cc92d0";

export const DATA_TEST_ID = {
  ICON_BUTTON: `icon-button-${uniqueId}`,
};

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.spacing(theme.tabiyaSpacing.sm),
  lineHeight: "0",
  paddingY: theme.spacing(theme.tabiyaSpacing.xs),
  paddingX: theme.spacing(theme.tabiyaSpacing.md),
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

const CustomIconButton: React.FC<CustomIconButtonProps> = ({ handleClick, icon, disabled,  ariaLabel }) => {
  return (
    <StyledIconButton color={"primary"} aria-label={ariaLabel} onClick={handleClick} data-testid={DATA_TEST_ID.ICON_BUTTON} disabled={disabled}>
      {icon}
    </StyledIconButton>
  );
};

export default CustomIconButton;
