import { Icon, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import { MenuItemConfig } from "./menuItemConfig.types";

export interface ContextMenuProps {
  items: MenuItemConfig[];
  open: boolean;
  anchorEl: HTMLElement | null;
  notifyOnClose: () => void;
}

const uniqueId = "b7499b01-8082-4209-8667-c7d559a70caf";
export const DATA_TEST_ID = {
  MENU: `${uniqueId}-menu`,
  MENU_ITEM: `${uniqueId}-menu-item`,
  MENU_ITEM_ICON: `${uniqueId}-menu-item-icon`,
  MENU_ITEM_TEXT: `${uniqueId}-menu-item-text`,
};

function ContextMenu(props: Readonly<ContextMenuProps>) {
  const handleItemClick = (item: MenuItemConfig) => {
    props.notifyOnClose();
    item.action();
  };

  return (
    <Menu
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
      data-testid={DATA_TEST_ID.MENU}
    >
      {props.items.map((item) => (
        <MenuItem
          onClick={() => handleItemClick(item)}
          data-testid={DATA_TEST_ID.MENU_ITEM}
          disabled={item.disabled}
          key={item.id}
        >
          {item.icon && (
            <ListItemIcon data-testid={DATA_TEST_ID.MENU_ITEM_ICON}>
              <Icon color="primary">{item.icon}</Icon>
            </ListItemIcon>
          )}
          <ListItemText data-testid={DATA_TEST_ID.MENU_ITEM_TEXT}>
            <Typography variant="caption" color="primary">
              {item.text}
            </Typography>
          </ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );
}

export default ContextMenu;
