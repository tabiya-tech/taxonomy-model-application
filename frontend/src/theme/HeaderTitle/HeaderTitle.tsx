import React from "react";
import { Typography } from "@mui/material";

export interface HeaderTitleProps {
  children: React.ReactNode;
  "data-testid"?: string;
}

/**
 * Reusable title component for Headers in the app.
 * Should use h2 variant of the mui typography
 * @param props gets data-testid for testing from parent
 * @constructor
 */
const HeaderTitle: React.FC<HeaderTitleProps> = (props: Readonly<HeaderTitleProps>) => {
  return (
    <Typography variant="h2" data-testid={props["data-testid"]} sx={{ wordWrap: "break-word" }}>
      {props.children}
    </Typography>
  );
};

export default HeaderTitle;
