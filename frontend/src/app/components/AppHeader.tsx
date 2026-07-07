import { Box, Link, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import { routerPaths } from "src/app/routerPaths";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "src/auth/AuthProvider";
import ContextMenu from "src/theme/ContextMenu/ContextMenu";
import { MenuItemConfig } from "src/theme/ContextMenu/menuItemConfig.types";
import { LoginOutlined, LogoutOutlined } from "@mui/icons-material";
import PrimaryIconButton from "src/theme/PrimaryIconButton/PrimaryIconButton";

const uniqueId = "65b0785e-14d9-43a3-b260-869983312406";
export const DATA_TEST_ID = {
  APP_HEADER_CONTAINER: `app-header-container-${uniqueId}`,
  APP_HEADER_LOGO: `app-header-logo-${uniqueId}`,
  APP_HEADER_LOGO_LINK: `app-header-logo-link-${uniqueId}`,
  APP_HEADER_ICON_USER: `app-header-icon-user-${uniqueId}`,
  APP_HEADER_AUTH_BUTTON: `app-header-auth-button-${uniqueId}`,
  APP_HEADER_DOCUMENTATION_LINK: `app-header-documentation-link-${uniqueId}`,
  APP_HEADER_API_DOCS_LINK: `app-header-api-docs-link-${uniqueId}`,
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
  const { login, logout, user } = useContext(AuthContext);
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
      <Box display="flex" alignItems="center" sx={{ gap: (theme) => theme.tabiyaSpacing.lg }}>
        <Link
          href="https://docs.tabiya.org/our-tech-stack/inclusive-livelihoods-taxonomy"
          underline="none"
          variant="body1"
          target="_blank"
          rel="noopener noreferrer"
          data-testid={DATA_TEST_ID.APP_HEADER_DOCUMENTATION_LINK}
          sx={{ color: (theme) => theme.palette.text.primary, fontWeight: 500 }}
        >
          Documentation
        </Link>
        <Link
          href="#"
          underline="none"
          variant="body1"
          data-testid={DATA_TEST_ID.APP_HEADER_API_DOCS_LINK}
          sx={{ color: (theme) => theme.palette.text.primary, fontWeight: 500 }}
        >
          API docs
        </Link>
        <Box display="flex" alignItems="center" sx={{ gap: (theme) => theme.tabiyaSpacing.sm }}>
          <Typography variant="body1">{user?.username}</Typography>
          <PrimaryIconButton
            onClick={(event) => setAnchorEl(event.currentTarget)}
            data-testid={DATA_TEST_ID.APP_HEADER_AUTH_BUTTON}
            sx={{ padding: (theme) => theme.tabiyaSpacing.xs }}
            title={"Account"}
          >
            <PermIdentityIcon data-testid={DATA_TEST_ID.APP_HEADER_ICON_USER} />
          </PrimaryIconButton>
        </Box>
      </Box>
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
