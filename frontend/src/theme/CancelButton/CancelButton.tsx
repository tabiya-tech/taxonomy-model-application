import {styled, Button, ButtonProps} from "@mui/material";
import React from "react";

interface CancelButtonProps extends ButtonProps {
  // Add additional props specific to Cancel Button here
}

const StyledButton = styled(Button)(({theme}) => ({
  // Define your default custom styles here using the theme object or CSS-in-JS
  // ...
}));

const CancelButton: React.FC<CancelButtonProps> = ({style, children, ...props}) => {
  /*
  React.useEffect(() => {
    if (React.Children.count(children) > 0) {
      console.warn("CancelButton component does not support children. Please remove any children elements.");
    }
  }, [children]);
  */

  return (
    <StyledButton style={style} {...props}>
      {children ?? "Cancel"}
    </StyledButton>
  );
};

export default CancelButton;
