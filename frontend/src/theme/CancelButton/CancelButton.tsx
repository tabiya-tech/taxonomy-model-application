import { ButtonProps } from "@mui/material";
import React from "react";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";

interface CancelButtonProps extends ButtonProps {
  // Add additional props specific to Cancel Button here
}

const CancelButton: React.FC<CancelButtonProps> = ({ children, ...props }: Readonly<CancelButtonProps>) => {
  return (
    // props are passed to the component last, so that they can override the default values
    <PrimaryButton variant={"outlined"} {...props}>
      {children ?? "Cancel"}
    </PrimaryButton>
  );
};

export default CancelButton;
