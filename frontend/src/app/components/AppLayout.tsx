import React from 'react';
import Box from '@mui/material/Box';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import { styled } from '@mui/material';


const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  height: 100%;
  padding-left: 24px;
`;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <Container
      data-testid='TaxonomyModelApp'
      bgcolor='secondary.main'
    >
      <AppHeader />
      <Box display='flex' flexDirection='row' flex={1} gap={3} overflow='hidden'>
        <AppSidebar />
        <Box flex={1} display='flex' marginX='24px'>
          {children}
        </Box>
      </Box>
    </Container>
  );
};

export default AppLayout;
