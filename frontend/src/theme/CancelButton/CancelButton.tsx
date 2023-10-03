import { Button, ButtonProps, useTheme} from "@mui/material";
import React from "react";

interface CancelButtonProps extends ButtonProps {
  // Add additional props specific to Cancel Button here
}



const CancelButton: React.FC<CancelButtonProps> = ({style, children, ...props}) => {
  const theme = useTheme()
  return (
    <Button variant={'outlined'} style={style} {...props} sx={{borderRadius: theme.tabiyaRounding.xl}}>
      {children ?? "Cancel"}
    </Button>
  );
};

export default CancelButton;
