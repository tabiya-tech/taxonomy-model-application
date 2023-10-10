import { Box } from "@mui/material";
import { NavLink } from "react-router-dom";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import { routerPaths } from "src/app/routerConfig";

const uniqueId = "65b0785e-14d9-43a3-b260-869983312406";
export const DATA_TEST_ID = {
  APP_HEADER_CONTAINER: `app-header-container-${uniqueId}`,
  APP_HEADER_LOGO: `app-header-logo-${uniqueId}`,
  APP_HEADER_LOGO_LINK: `app-header-logo-link-${uniqueId}`,
  APP_HEADER_ICON_USER: `app-header-icon-user-${uniqueId}`,
};
const AppHeader = () => {
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
      <PermIdentityIcon data-testid={DATA_TEST_ID.APP_HEADER_ICON_USER} />
    </Box>
  );
};
export default AppHeader;
