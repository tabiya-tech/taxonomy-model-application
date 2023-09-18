import { NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VerticalSplitOutlinedIcon from '@mui/icons-material/VerticalSplitOutlined';
import { styled } from '@mui/material';

const uniqueId = '579896ed-8a99-4a1e-8dc4-e4236d7b06df';
export const DATA_TEST_ID = {
  APP_SIDEBAR_CONTAINER: `app-sidebar-container-${uniqueId}`,
  APP_SIDEBAR_ICON_DIRECTORY: `app-sidebar-icon-directory-${uniqueId}`,
  APP_SIDEBAR_ICON_EXPLORE: `app-sidebar-icon-explore-${uniqueId}`,
  APP_SIDEBAR_ICON_EDIT: `app-sidebar-icon-edit-${uniqueId}`,
  APP_SIDEBAR_ICON_USER: `app-sidebar-icon-user-${uniqueId}`,
  APP_SIDEBAR_ICON_SETTINGS: `app-sidebar-icon-settings-${uniqueId}`,
  APP_SIDEBAR_DIRECTORY_LINK: `app-sidebar-directory-link-${uniqueId}`,
  APP_SIDEBAR_EXPLORE_LINK: `app-sidebar-explore-link-${uniqueId}`,
  APP_SIDEBAR_EDIT_LINK: `app-sidebar-edit-link-${uniqueId}`,
  APP_SIDEBAR_USER_LINK: `app-sidebar-user-link-${uniqueId}`,
  APP_SIDEBAR_SETTINGS_LINK: `app-sidebar-settings-link-${uniqueId}`,
};

export const ITEMS_LABEL_TEXT = {
  [DATA_TEST_ID.APP_SIDEBAR_ICON_DIRECTORY]: 'Directory',
  [DATA_TEST_ID.APP_SIDEBAR_ICON_EXPLORE]: 'Explore',
  [DATA_TEST_ID.APP_SIDEBAR_ICON_EDIT]: 'Model',
  [DATA_TEST_ID.APP_SIDEBAR_ICON_USER]: 'Users',
  [DATA_TEST_ID.APP_SIDEBAR_ICON_SETTINGS]: 'Settings',
};

const appSidebarItems = [
  {
    icon: (
      <FolderOutlinedIcon
        sx={{ width: '24px', height: '24px' }}
        data-testid={DATA_TEST_ID.APP_SIDEBAR_ICON_DIRECTORY}
        className='item-icon'
      />
    ),
    label: ITEMS_LABEL_TEXT[DATA_TEST_ID.APP_SIDEBAR_ICON_DIRECTORY],
    pathName: '/',
    iconLinkTestID: DATA_TEST_ID.APP_SIDEBAR_DIRECTORY_LINK,
  },
  {
    icon: (
      <VerticalSplitOutlinedIcon
        sx={{ width: '24px', height: '24px' }}
        data-testid={DATA_TEST_ID.APP_SIDEBAR_ICON_EXPLORE}
        className='item-icon'
      />
    ),
    label: ITEMS_LABEL_TEXT[DATA_TEST_ID.APP_SIDEBAR_ICON_EXPLORE],
    pathName: '/explore',
    iconLinkTestID: DATA_TEST_ID.APP_SIDEBAR_EXPLORE_LINK,
  },
  {
    icon: (
      <EditOutlinedIcon
        sx={{ width: '24px', height: '24px' }}
        data-testid={DATA_TEST_ID.APP_SIDEBAR_ICON_EDIT}
        className='item-icon'
      />
    ),
    label: ITEMS_LABEL_TEXT[DATA_TEST_ID.APP_SIDEBAR_ICON_EDIT],
    pathName: 'edit',
    iconLinkTestID: DATA_TEST_ID.APP_SIDEBAR_EDIT_LINK,
  },
  {
    icon: (
      <PermIdentityIcon
        sx={{ width: '24px', height: '24px' }}
        data-testid={DATA_TEST_ID.APP_SIDEBAR_ICON_USER}
        className='item-icon'
      />
    ),
    label: ITEMS_LABEL_TEXT[DATA_TEST_ID.APP_SIDEBAR_ICON_USER],
    pathName: '/users',
    iconLinkTestID: DATA_TEST_ID.APP_SIDEBAR_USER_LINK,
  },
  {
    icon: (
      <SettingsIcon
        sx={{ width: '24px', height: '24px' }}
        data-testid={DATA_TEST_ID.APP_SIDEBAR_ICON_SETTINGS}
        className='item-icon'
      />
    ),
    label: ITEMS_LABEL_TEXT[DATA_TEST_ID.APP_SIDEBAR_ICON_SETTINGS],
    pathName: '/settings',
    iconLinkTestID: DATA_TEST_ID.APP_SIDEBAR_SETTINGS_LINK,
  },
];

const CustomNavLink = styled(NavLink)`
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: #43474e;
  .item-icon {
    display: flex;
    align-items: center;
    padding: 4px 14px;
    border-radius: 16px;
  }
  &.active {
    .item-icon {
      background-color: #5cff9f;
    }
  }
  .item-label {
    font-size: 12px;
    color: #43474e;
  }
  &:hover {
    .item-icon {
      background-color: #5cff9f;
    }
  }
`;

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  //margin-top: 44px;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  height: 100%;
  padding-left: 24px;
`;

const AppSidebar = () => {
  return (
    <Container
      gap='12px'
      data-testid={DATA_TEST_ID.APP_SIDEBAR_CONTAINER}
    >
      {appSidebarItems.map((item) => (
        <CustomNavLink key={item.pathName} to={item.pathName} data-testid={item.iconLinkTestID}>
          {item.icon}
          <span className='item-label'>{item.label}</span>
        </CustomNavLink>
      ))}
    </Container>
  );
};
export default AppSidebar;
