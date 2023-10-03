import React from 'react';
import Box from '@mui/material/Box';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import { styled, useTheme } from '@mui/material';


const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${({theme}) => theme.spacing(theme.tabiyaSpacing.lg)};
  padding-bottom: ${({theme}) => theme.spacing(theme.tabiyaSpacing.none)};
  gap: ${({theme}) => theme.spacing(theme.tabiyaSpacing.xl)};
`;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const DATA_TEST_ID = {
  LAYOUT : "cabab611-7d62-417a-a4a7-5d8f7266ea92"
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme()
  return (
    <Container
      data-testid={DATA_TEST_ID.LAYOUT}
      bgcolor='containerBackground.main'
    >
      <AppHeader />
      <Box display='flex' flexDirection='row' flex={1} gap={theme.tabiyaSpacing.xl} overflow='hidden'>
        <AppSidebar />
        <Box flex={1} display='flex'>
          {children}
        </Box>
      </Box>
    </Container>
  );
};

export default AppLayout;
