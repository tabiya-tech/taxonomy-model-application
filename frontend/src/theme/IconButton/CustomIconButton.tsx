import React from "react";
import { IconButton, IconButtonProps, styled } from "@mui/material";

interface CustomIconButtonProps extends IconButtonProps {
  // Add additional props specific to CustomIconButton here
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

const CustomIconButton: React.FC<CustomIconButtonProps> = ({ children, ...props }) => {
  return (
    <StyledIconButton color={"primary"} {...props}>
      {children}
    </StyledIconButton>
  );
};

export default CustomIconButton;
