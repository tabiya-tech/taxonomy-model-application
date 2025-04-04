import React from "react";

import { Box, IconButton, Tooltip } from "@mui/material";
import { HelpRounded } from "@mui/icons-material";

export interface HelpTipProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

const uniqueId = "4b757f12-fb67-4a59-94b1-b8a2498a7a49";

export const DATA_TEST_ID = {
  HELP_ICON: `help-icon-${uniqueId}`,
};

/**
 * HelpTip is responsible for showing a tooltip that shows a helpful dialog with some react component
 * @param props
 * @constructor
 */

const HelpTip: React.FC<HelpTipProps> = (props: Readonly<HelpTipProps>) => {
  const [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);

  const handleOpen = () => setOpen(true);

  return (
    <Tooltip
      open={open}
      aria-label="help"
      data-testid={props["data-testid"]}
      describeChild
      disableTouchListener
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onClick={handleOpen}
      onBlur={handleClose}
      title={<Box>{props.children}</Box>}
    >
      <IconButton data-testid={DATA_TEST_ID.HELP_ICON} color={"primary"} sx={{ padding: "5px" }}>
        <HelpRounded />
      </IconButton>
    </Tooltip>
  );
};

export default HelpTip;
