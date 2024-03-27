import { Box, IconButton } from "@mui/material";
import { NavLink } from "react-router-dom";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import { routerPaths } from "src/app/routerConfig";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext, AuthContextValue } from "src/app/providers/AuthProvider";
import ContextMenu from "src/theme/ContextMenu/ContextMenu";
import { MenuItemConfig } from "src/theme/ContextMenu/menuItemConfig.types";
import { LoginOutlined, LogoutOutlined } from "@mui/icons-material";

const uniqueId = "65b0785e-14d9-43a3-b260-869983312406";
export const DATA_TEST_ID = {
  APP_HEADER_CONTAINER: `app-header-container-${uniqueId}`,
  APP_HEADER_LOGO: `app-header-logo-${uniqueId}`,
  APP_HEADER_LOGO_LINK: `app-header-logo-link-${uniqueId}`,
  APP_HEADER_ICON_USER: `app-header-icon-user-${uniqueId}`,
  APP_HEADER_AUTH_BUTTON: `app-header-auth-button-${uniqueId}`,
};
export const MENU_ITEM_ID = {
  LOGIN: `login-${uniqueId}`,
  LOGOUT: `logout-${uniqueId}`,
};
export const MENU_ITEM_TEXT = {
  LOGIN: "Login",
  LOGOUT: "Logout",
};

const AppHeader = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { login, logout, user } = useContext(AuthContext) as AuthContextValue;
  const [contextMenuItems, setContextMenuItems] = useState<MenuItemConfig[]>([]);

  useEffect(() => {
    const loginLogoutItem = user
      ? {
          id: MENU_ITEM_ID.LOGOUT,
          text: MENU_ITEM_TEXT.LOGOUT,
          icon: <LogoutOutlined />,
          disabled: false,
          action: logout,
        }
      : {
          id: MENU_ITEM_ID.LOGIN,
          text: MENU_ITEM_TEXT.LOGIN,
          icon: <LoginOutlined />,
          disabled: false,
          action: login,
        };
    setContextMenuItems([loginLogoutItem]);
  }, [login, logout, user]);

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      data-testid={DATA_TEST_ID.APP_HEADER_CONTAINER}
    >
      <NavLink style={{ lineHeight: 0 }} to={routerPaths.ROOT} data-testid={DATA_TEST_ID.APP_HEADER_LOGO_LINK}>
        <img src="/logo.svg" alt="Tabiya" height={"30px"} data-testid={DATA_TEST_ID.APP_HEADER_LOGO} />
      </NavLink>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        data-testid={DATA_TEST_ID.APP_HEADER_AUTH_BUTTON}
      >
        <PermIdentityIcon data-testid={DATA_TEST_ID.APP_HEADER_ICON_USER} titleAccess="Auth" />
      </IconButton>
      <ContextMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        notifyOnClose={() => setAnchorEl(null)}
        items={contextMenuItems}
      />
    </Box>
  );
};
export default AppHeader;
