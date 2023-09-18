import {NavLink} from 'react-router-dom';
import Box from '@mui/material/Box';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VerticalSplitOutlinedIcon from '@mui/icons-material/VerticalSplitOutlined';
import {styled, Typography} from '@mui/material';
import {routerPaths} from "src/app/routerConfig";

const uniqueId = '579896ed-8a99-4a1e-8dc4-e4236d7b06df';
export const DATA_TEST_ID = {
  CONTAINER: `app-sidebar-container-${uniqueId}`,
  DIRECTORY_LINK: `app-sidebar-directory-link-${uniqueId}`,
  DIRECTORY_ICON: `app-sidebar-directory-icon-${uniqueId}`,
  EXPLORE_LINK: `app-sidebar-explore-link-${uniqueId}`,
  EXPLORE_ICON: `app-sidebar-explore-icon-${uniqueId}`,
  EDIT_LINK: `app-sidebar-edit-link-${uniqueId}`,
  EDIT_ICON: `app-sidebar-edit-icon-${uniqueId}`,
  USER_LINK: `app-sidebar-user-link-${uniqueId}`,
  USER_ICON: `app-sidebar-user-icon-${uniqueId}`,
  SETTINGS_LINK: `app-sidebar-settings-link-${uniqueId}`,
  SETTINGS_ICON: `app-sidebar-settings-icon-${uniqueId}`,
};

export const ITEMS_LABEL_TEXT = {
  DIRECTORY: 'Directory',
  EXPLORE: 'Explore',
  EDIT: 'Model',
  USER: 'Users',
  SETTINGS: 'Settings',
};

const iconSize = {width: '24px', height: '24px'};

const appSidebarItems = [
  {
    icon:
      <FolderOutlinedIcon
        sx={iconSize}
        data-testid={DATA_TEST_ID.DIRECTORY_ICON}
      />
    ,
    label: ITEMS_LABEL_TEXT.DIRECTORY,
    pathName: routerPaths.MODEL_DIRECTORY,
    dataTestId: DATA_TEST_ID.DIRECTORY_LINK,
  },
  {
    icon:
      <VerticalSplitOutlinedIcon
        sx={iconSize}
        data-testid={DATA_TEST_ID.EXPLORE_ICON}
      />
    ,
    label: ITEMS_LABEL_TEXT.EXPLORE,
    pathName: routerPaths.EXPLORE,
    dataTestId: DATA_TEST_ID.EXPLORE_LINK,
  },
  {
    icon:
      <EditOutlinedIcon
        sx={iconSize}
        data-testid={DATA_TEST_ID.EDIT_ICON}
      />
    ,
    label: ITEMS_LABEL_TEXT.EDIT,
    pathName: routerPaths.EDIT,
    dataTestId: DATA_TEST_ID.EDIT_LINK,
  },
  {
    icon:
      <PermIdentityIcon
        sx={iconSize}
        data-testid={DATA_TEST_ID.USER_ICON}
      />
    ,
    label: ITEMS_LABEL_TEXT.USER,
    pathName: routerPaths.USERS,
    dataTestId: DATA_TEST_ID.USER_LINK,
  },
  {
    icon:
      <SettingsIcon
        sx={iconSize}
        data-testid={DATA_TEST_ID.SETTINGS_ICON}
      />
    ,
    label: ITEMS_LABEL_TEXT.SETTINGS,
    pathName: routerPaths.SETTINGS,
    dataTestId: DATA_TEST_ID.SETTINGS_LINK,
  },
];

const CustomNavLink = styled(NavLink)`
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${({theme}) => theme.palette.text.primary};

  &.active, &:hover {
    > .MuiBox-root {
      background-color: ${({theme}) => theme.palette.secondary.light};
    }
  }
`;


const AppSidebar = () => {
  return (
    <Box
      gap='1rem'
      display="flex"
      flexDirection="column"
      height="100%"
      data-testid={DATA_TEST_ID.CONTAINER}
    >
      {appSidebarItems.map((item) => (
        <CustomNavLink key={item.pathName} to={item.pathName} data-testid={item.dataTestId}>
          <Box paddingY="0.25rem" paddingX="0.8rem" borderRadius="1rem">
            {item.icon}
          </Box>
          <Typography fontSize="0.8rem">
            {item.label}
          </Typography>
        </CustomNavLink>
      ))}
    </Box>
  );
};
export default AppSidebar;
