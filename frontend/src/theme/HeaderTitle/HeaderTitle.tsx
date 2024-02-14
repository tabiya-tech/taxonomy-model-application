import React  from "react";
import { Typography } from "@mui/material";

export interface HeaderTitleProps {
  title: React.ReactNode;
  "data-testid": string;
}

/**
 * Reusable title component for Headers in the app.
 * Should use h2 variant of the mui typography
 * @param props gets data-testid for testing from parent
 * @constructor
 */
const HeaderTitle: React.FC<HeaderTitleProps> = (props : Readonly<HeaderTitleProps>) => {
  return <Typography variant="h2" data-testid={props["data-testid"]}>{props.title}</Typography>;
};

export default HeaderTitle;
