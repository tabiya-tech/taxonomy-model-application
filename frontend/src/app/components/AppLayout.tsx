import React from 'react';
import Box from '@mui/material/Box';
import AppHeader from './AppHeader';
import { ContentHeaderContainer } from './ContentHeaderContainer';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
}) => {
  return (
    <Box
      display='flex'
      flexDirection='column'
      height='100%'
      data-testid='TaxonomyModelApp'
    >
      <Box display='flex' flexDirection='column'>
        <AppHeader/>
        <Box
          style={{ backgroundColor: '#e78a8a' }} // TODO: remove this
          padding={2}
        >
          <ContentHeaderContainer/>
        </Box>
      </Box>
      <Box display='flex' flexDirection='row' flex={1}>
        <Box
          padding={2}
          style={{ backgroundColor: '#68bf5b' }} // TODO: remove this
        >
          <AppSidebar/>
        </Box>
        <Box flex={1} padding={2}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
