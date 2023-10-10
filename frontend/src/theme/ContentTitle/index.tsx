import React from "react";
import {Typography} from "@mui/material";

interface ContentTitleProps {
    text: string;
}

const ContentTitle = ({text}: Readonly<ContentTitleProps>) => {
    return (
        <Typography variant="h2" color="text.primary">
            {text}
        </Typography>
    );
};

export default ContentTitle;
