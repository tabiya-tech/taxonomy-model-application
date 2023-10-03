import {Box, useTheme} from "@mui/material";
import {NavLink} from "react-router-dom";
import SettingsIcon from '@mui/icons-material/Settings';
import LanguageIcon from '@mui/icons-material/Language';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import {routerPaths} from "src/app/routerConfig";

const uniqueId = "65b0785e-14d9-43a3-b260-869983312406";
export const DATA_TEST_ID = {
  APP_HEADER_CONTAINER: `app-header-container-${uniqueId}`,
  APP_HEADER_LOGO: `app-header-logo-${uniqueId}`,
  APP_HEADER_LOGO_LINK: `app-header-logo-link-${uniqueId}`,
  APP_HEADER_ICONS_CONTAINER: `app-header-icons-container-${uniqueId}`,
  APP_HEADER_ICON_SETTINGS: `app-header-icon-settings-${uniqueId}`,
  APP_HEADER_ICON_LANGUAGE: `app-header-icon-language-${uniqueId}`,
  APP_HEADER_ICON_USER: `app-header-icon-user-${uniqueId}`
};
const AppHeader = () => {
  const theme = useTheme()
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      data-testid={DATA_TEST_ID.APP_HEADER_CONTAINER}
    >
      <NavLink style={{lineHeight:0}} to={routerPaths.ROOT} data-testid={DATA_TEST_ID.APP_HEADER_LOGO_LINK}>
        <img src='/logo.svg' alt="Tabiya" height={"30px"} data-testid={DATA_TEST_ID.APP_HEADER_LOGO}/>
      </NavLink>
      <Box display="flex" alignItems="center" gap={{xs: theme.tabiyaSpacing.md, md: theme.tabiyaSpacing.lg}}
           data-testid={DATA_TEST_ID.APP_HEADER_ICONS_CONTAINER}>
        <SettingsIcon sx={{width: "24px", height: "24px"}} data-testid={DATA_TEST_ID.APP_HEADER_ICON_SETTINGS}/>
        <LanguageIcon sx={{width: "24px", height: "24px"}} data-testid={DATA_TEST_ID.APP_HEADER_ICON_LANGUAGE}/>
        <PermIdentityIcon sx={{width: "24px", height: "24px"}} data-testid={DATA_TEST_ID.APP_HEADER_ICON_USER}/>
      </Box>
    </Box>
  )
};
export default AppHeader;