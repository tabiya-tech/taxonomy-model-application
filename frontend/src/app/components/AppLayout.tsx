import React from 'react';
import Box from '@mui/material/Box';
import AppHeader from './AppHeader';
import ContentHeaderContainer from './ContentHeaderContainer';
import AppSidebar from './AppSidebar';
import {useTheme} from "@mui/material";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  return (
    <Box display='flex' flexDirection='column' fontFamily={theme.typography.fontFamily} height='100%'
         data-testid='TaxonomyModelApp' bgcolor="secondary.main" paddingLeft={3}>
      <Box display='flex' flexDirection='column'>
        <AppHeader/>
        <ContentHeaderContainer/>
      </Box>
      <Box display='flex' flexDirection='row' flex={1} gap={3} overflow="hidden">
        <AppSidebar/>
        <Box flex={1}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
