import React, { useContext } from "react";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ModelInfo = ModelInfoTypes.ModelInfo;
import { Icon, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import { IsOnlineContext } from "src/app/providers";

const uniqueId = "2d06ac7f-1dd6-456a-97d8-54f34858d727";

export const DATA_TEST_ID = {
  MENU: `${uniqueId}-menu`,
  MENU_ITEM: `${uniqueId}-menu-item`,
  MENU_ITEM_ICON: `${uniqueId}-menu-item-icon`,
  MENU_ITEM_TEXT: `${uniqueId}-menu-item-text`,
};

export interface MenuItemConfig {
  text: string;
  icon: React.ReactNode;
  disableOnNonSuccessfulImport?: boolean;
  disableWhenOffline?: boolean;
  onClick: (modelId: string) => void;
}

export interface MenuBuilderProps {
  items: MenuItemConfig[];
  open: boolean;
  anchorEl: HTMLElement | null;
  model: ModelInfo | null;
  notifyOnClose: () => void;
}

export const isModelNotSuccessfullyImported = (model: ModelInfo | null) => {
  return (
    model?.importProcessState?.status !== ImportProcessStateAPISpecs.Enums.Status.COMPLETED ||
    model?.importProcessState?.result.errored !== false
  );
};

function MenuBuilder(props: Readonly<MenuBuilderProps>) {
  const isOnline = useContext(IsOnlineContext);

  const isItemDisabled = (item: MenuItemConfig) => {
    if (!isOnline && item.disableWhenOffline) return true;
    return item.disableOnNonSuccessfulImport && isModelNotSuccessfullyImported(props.model);
  };

  const handleItemClick = (item: MenuItemConfig) => {
    props.notifyOnClose();
    item.onClick(props.model!.id);
  };

  return (
    <Menu
      data-testid={DATA_TEST_ID.MENU}
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
      {props.items.map((item, index) => (
        <MenuItem
          onClick={() => handleItemClick(item)}
          component="button"
          data-testid={DATA_TEST_ID.MENU_ITEM}
          disabled={isItemDisabled(item)}
          key={index}
        >
          <ListItemIcon data-testid={DATA_TEST_ID.MENU_ITEM_ICON}>
            <Icon color="primary">{item.icon}</Icon>
          </ListItemIcon>
          <ListItemText data-testid={DATA_TEST_ID.MENU_ITEM_TEXT}>
            <Typography variant={"caption"} color={"primary"}>
              {item.text}
            </Typography>
          </ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );
}

export default MenuBuilder;
