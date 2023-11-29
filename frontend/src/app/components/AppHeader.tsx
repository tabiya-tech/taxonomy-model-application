import { Box, IconButton, Menu, MenuItem } from "@mui/material";
import { NavLink } from "react-router-dom";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import { routerPaths } from "src/app/routerConfig";
import * as React from "react";
import { AuthContext } from "../providers";
import { useState } from "react";

const uniqueId = "65b0785e-14d9-43a3-b260-869983312406";
export const DATA_TEST_ID = {
  APP_HEADER_CONTAINER: `app-header-container-${uniqueId}`,
  APP_HEADER_LOGO: `app-header-logo-${uniqueId}`,
  APP_HEADER_LOGO_LINK: `app-header-logo-link-${uniqueId}`,
  APP_HEADER_ICON_USER: `app-header-icon-user-${uniqueId}`,
};
const AppHeader = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUser = () => {
    // set cookie to user
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
      <IconButton onClick={handleClick}>
        <PermIdentityIcon data-testid={DATA_TEST_ID.APP_HEADER_ICON_USER} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleUser}>User</MenuItem>
        <MenuItem>Model Manager</MenuItem>
        <MenuItem>Admin</MenuItem>
      </Menu>
    </Box>
  );
};
export default AppHeader;
