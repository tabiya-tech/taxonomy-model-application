import React from "react";
import Box from "@mui/material/Box";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import { styled, useTheme } from "@mui/material";

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  flex: 1;
  // Currently the boxing-size is set to border-box via the CSSBaseline,
  // however if it is set to content-box then we need to account for padding
  // otherwise the component will overflow
  // e.g. height: calc(100% - ${({ theme }) => theme.spacing(theme.tabiyaSpacing.xl)});
  height: 100%;
  padding: ${({ theme }) => theme.spacing(theme.tabiyaSpacing.xl)};
  padding-bottom: ${({ theme }) => theme.spacing(theme.tabiyaSpacing.none)};
  gap: ${({ theme }) => theme.spacing(theme.tabiyaSpacing.xl)};
`;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const DATA_TEST_ID = {
  LAYOUT: "cabab611-7d62-417a-a4a7-5d8f7266ea92",
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }: Readonly<AppLayoutProps>) => {
  const theme = useTheme();
  return (
    <Container data-testid={DATA_TEST_ID.LAYOUT} bgcolor="containerBackground.main">
      <AppHeader />
      <Box display="flex" flexDirection="row" flex={1} gap={theme.tabiyaSpacing.xl} overflow="hidden">
        <AppSidebar />
        <Box sx={{ flex: 1, display: "flex", overflow: "auto" }}>{children}</Box>
      </Box>
    </Container>
  );
};

export default AppLayout;
