import { Box, IconButton, Menu, MenuItem } from "@mui/material";
import { NavLink } from "react-router-dom";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import { routerPaths } from "src/app/routerConfig";
import * as React from "react";
import { useState } from "react";
import { AuthContext, UserRole, UserRoleContextValue } from "../providers";

const uniqueId = "65b0785e-14d9-43a3-b260-869983312406";
export const DATA_TEST_ID = {
  APP_HEADER_CONTAINER: `app-header-container-${uniqueId}`,
  APP_HEADER_LOGO: `app-header-logo-${uniqueId}`,
  APP_HEADER_LOGO_LINK: `app-header-logo-link-${uniqueId}`,
  APP_HEADER_ICON_USER: `app-header-icon-user-${uniqueId}`,
};
const AppHeader = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { userRole, setCookie } = React.useContext(AuthContext) as UserRoleContextValue;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUser = () => {
    setCookie("authCookie", UserRole.ReadOnlyUser);
    setAnchorEl(null);
  };

  const handleModelManager = () => {
    setCookie("authCookie", UserRole.ModelManager);
    setAnchorEl(null);
  };

  const handleAdmin = () => {
    setCookie("authCookie", UserRole.Admin);
    setAnchorEl(null);
  };

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
      <Box display="flex" alignItems="center" gap={2}>
        {userRole === UserRole.Admin ? "Admin" : userRole === UserRole.ReadOnlyUser ? "User" : "Model Manager"}
        <IconButton onClick={handleClick}>
          <PermIdentityIcon data-testid={DATA_TEST_ID.APP_HEADER_ICON_USER} />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem onClick={handleUser}>User</MenuItem>
          <MenuItem onClick={handleModelManager}>Model Manager</MenuItem>
          <MenuItem onClick={handleAdmin}>Admin</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
export default AppHeader;
