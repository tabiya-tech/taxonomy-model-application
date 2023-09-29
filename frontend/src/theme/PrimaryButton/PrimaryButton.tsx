import {styled, Button, ButtonProps} from "@mui/material";
import React from "react";

interface PrimaryButtonProps extends ButtonProps {
    // Add additional props specific to PrimaryButton Button here
}

const StyledButton = styled(Button)`
    border-radius: 6.25rem;
`;

const PrimaryButton: React.FC<PrimaryButtonProps> = ({style, children, ...props}) => {
    return (
        <StyledButton variant={'contained'} style={style} {...props}>
            {children ?? "Click here"}
        </StyledButton>
    );
};

export default PrimaryButton;
