import {styled, Button, ButtonProps} from "@mui/material";
import React from "react";

interface CancelButtonProps extends ButtonProps {
  // Add additional props specific to Cancel Button here
}

const StyledButton = styled(Button)`
  border-radius: 6.25rem;
`;

const CancelButton: React.FC<CancelButtonProps> = ({style, children, ...props}) => {
  return (
    <StyledButton variant={'outlined'} style={style} {...props}>
      {children ?? "Cancel"}
    </StyledButton>
  );
};

export default CancelButton;
