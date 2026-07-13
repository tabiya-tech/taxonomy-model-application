import { NavLink } from "react-router-dom";
import Box from "@mui/material/Box";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
// import SettingsIcon from "@mui/icons-material/Settings";
import VerticalSplitOutlinedIcon from "@mui/icons-material/VerticalSplitOutlined";
import { styled, Typography, useTheme } from "@mui/material";
import { routerPaths } from "src/app/routerPaths";

const uniqueId = "579896ed-8a99-4a1e-8dc4-e4236d7b06df";
export const DATA_TEST_ID = {
  CONTAINER: `app-sidebar-container-${uniqueId}`,
  DIRECTORY_LINK: `app-sidebar-directory-link-${uniqueId}`,
  DIRECTORY_ICON: `app-sidebar-directory-icon-${uniqueId}`,
  EXPLORE_LINK: `app-sidebar-explore-link-${uniqueId}`,
  EXPLORE_ICON: `app-sidebar-explore-icon-${uniqueId}`,
  // SETTINGS_LINK: `app-sidebar-settings-link-${uniqueId}`,
  // SETTINGS_ICON: `app-sidebar-settings-icon-${uniqueId}`,
};

export const ITEMS_LABEL_TEXT = {
  DIRECTORY: "Directory",
  EXPLORE: "Explore",
  // SETTINGS: "Settings",
};

const appSidebarItems = [
  {
    icon: <FolderOutlinedIcon data-testid={DATA_TEST_ID.DIRECTORY_ICON} />,
    label: ITEMS_LABEL_TEXT.DIRECTORY,
    pathName: routerPaths.MODEL_DIRECTORY,
    dataTestId: DATA_TEST_ID.DIRECTORY_LINK,
  },
  {
    icon: <VerticalSplitOutlinedIcon data-testid={DATA_TEST_ID.EXPLORE_ICON} />,
    label: ITEMS_LABEL_TEXT.EXPLORE,
    pathName: routerPaths.EXPLORER,
    dataTestId: DATA_TEST_ID.EXPLORE_LINK,
  },
  // Settings is intentionally not shown in the sidebar. The info page it linked to is still
  // reachable by typing the /info URL directly.
  // {
  //   icon: <SettingsIcon data-testid={DATA_TEST_ID.SETTINGS_ICON} />,
  //   label: ITEMS_LABEL_TEXT.SETTINGS,
  //   pathName: routerPaths.INFO,
  //   dataTestId: DATA_TEST_ID.SETTINGS_LINK,
  // },
];

const CustomNavLink = styled(NavLink)`
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.palette.containerBackground.contrastText};

  &.active {
    > .MuiBox-root {
      background-color: ${({ theme }) => theme.palette.primary.main};
      color: ${({ theme }) => theme.palette.primary.contrastText};
    }
  }
  &:hover {
    > .MuiBox-root {
      background-color: ${({ theme }) => theme.palette.primary.light};
      color: ${({ theme }) => theme.palette.primary.contrastText};
    }
  }
`;

const AppSidebar = () => {
  const theme = useTheme();

  return (
    <Box
      gap={theme.fixedSpacing(theme.tabiyaSpacing.sm)}
      display="flex"
      flexDirection="column"
      height="100%"
      data-testid={DATA_TEST_ID.CONTAINER}
    >
      {appSidebarItems.map((item) => (
        <CustomNavLink key={item.pathName} to={item.pathName} data-testid={item.dataTestId}>
          <Box lineHeight={"0"} padding={theme.fixedSpacing(1.3)} borderRadius={theme.tabiyaRounding.sm}>
            {item.icon}
          </Box>
          <Typography variant="caption">{item.label}</Typography>
        </CustomNavLink>
      ))}
    </Box>
  );
};
export default AppSidebar;
