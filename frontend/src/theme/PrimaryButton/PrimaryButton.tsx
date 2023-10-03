import { Button, ButtonProps, useTheme} from "@mui/material";
import React from "react";

interface PrimaryButtonProps extends ButtonProps {
    // Add additional props specific to PrimaryButton Button here
}


const PrimaryButton: React.FC<PrimaryButtonProps> = ({style, children, ...props}) => {
    const theme = useTheme()
    return (
        <Button variant={'contained'} style={style} {...props} sx={{borderRadius: theme.tabiyaRounding.xl}}>
            {children ?? "Click here"}
        </Button>
    );
};

export default PrimaryButton;
