import React from 'react';
import {Typography} from "@mui/material";

const ContentTitle = ({text}: {text: string}) => {
    return <Typography variant="h2" color="text.primary">{text}</Typography>;
};

export default ContentTitle;