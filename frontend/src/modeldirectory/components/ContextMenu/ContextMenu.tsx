import * as React from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

export interface ContextMenuProps {
  anchorEl?: HTMLElement | null;
  open: boolean;
  isExportDisabled: boolean;
  notifyOnClose: () => void;
  notifyOnExport: () => void;
}

const uniqueId = "715a535d-ca4b-4252-b967-8d5b5b2381b9";

export const DATA_TEST_ID = {
  CONTEXT_MENU: `context-menu-${uniqueId}`,
  MENU_ITEM_EXPORT: `menu-item-export-${uniqueId}`,
};

const ContextMenu = (props: Readonly<ContextMenuProps>) => {
  function handleExport() {
    props.notifyOnClose();
    props.notifyOnExport();
  }

  return (
    <Menu
      data-testid={DATA_TEST_ID.CONTEXT_MENU}
      elevation={2}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      anchorEl={props.anchorEl}
      open={props.open}
      onClose={props.notifyOnClose}
    >
      <MenuItem
        onClick={() => handleExport()}
        component="button"
        data-testid={DATA_TEST_ID.MENU_ITEM_EXPORT}
        disabled={props.isExportDisabled}
      >
        <ListItemIcon>
          <CloudDownloadIcon color="primary" />
        </ListItemIcon>
        <ListItemText>
          <Typography variant={"caption"} color={"primary"}>
            Export
          </Typography>
        </ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;
