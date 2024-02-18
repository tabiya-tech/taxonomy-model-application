import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import { styled, useTheme } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import CustomIconButton from "src/theme/IconButton/CustomIconButton";

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
  // The padding-left is set to none
  // as we want the toggle button to be aligned with the left edge of the screen when the sidebar is hidden
  padding-left: ${({ theme }) => theme.spacing(theme.tabiyaSpacing.none)};
  padding-bottom: ${({ theme }) => theme.spacing(theme.tabiyaSpacing.none)};
  gap: ${({ theme }) => theme.spacing(theme.tabiyaSpacing.xl)};
`;

interface AppLayoutProps {
  children: React.ReactNode;
}

const uniqueId = "cabab611-7d62-417a-a4a7-5d8f7266ea92";
export const DATA_TEST_ID = {
  LAYOUT: `layout-root-${uniqueId}`,
  TOGGLE_BUTTON: `toggle-button-${uniqueId}`,
};
export const SIDEBAR_ANIMATION_DURATION_SECONDS = 0.5;

export const AppLayout: React.FC<AppLayoutProps> = ({ children }: Readonly<AppLayoutProps>) => {
  const theme = useTheme();
  const [isAppSidebarVisible, setIsAppSidebarVisible] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    // After the first render, set isFirstRender to false
    setIsFirstRender(false);
  }, []); // Empty dependency array means this effect runs once after the initial render

  const toggleAppSidebar = () => {
    setIsAppSidebarVisible(!isAppSidebarVisible);
  };

  return (
    <Container data-testid={DATA_TEST_ID.LAYOUT} bgcolor="containerBackground.main">
      <Box sx={{ marginLeft: (theme) => theme.spacing(theme.tabiyaSpacing.xl) }}>
        <AppHeader />
      </Box>
      <Box display="flex" flexDirection="row" flex={1} gap={0} overflow="hidden">
        <AnimatePresence>
          {isAppSidebarVisible && (
            <motion.div
              initial={
                isFirstRender
                  ? { marginLeft: theme.spacing(theme.tabiyaSpacing.xl) }
                  : {
                      marginLeft: "0",
                      opacity: 0,
                      width: 0,
                    }
              } // Avoid animation on first render
              animate={{ marginLeft: theme.spacing(theme.tabiyaSpacing.xl), opacity: 1, width: "auto" }}
              exit={{ marginLeft: "0", opacity: 0, width: 0 }}
              transition={{ duration: SIDEBAR_ANIMATION_DURATION_SECONDS }}
            >
              <AppSidebar />
            </motion.div>
          )}
        </AnimatePresence>
        <ToggleAppSidebarButton toggleAppSidebarCallBack={toggleAppSidebar} isAppSidebarVisible={isAppSidebarVisible} />
        <Box sx={{ flex: 1, display: "flex", overflow: "auto" }}>{children}</Box>
      </Box>
    </Container>
  );
};

export default AppLayout;

const ToggleAppSidebarButton = (props: { toggleAppSidebarCallBack: () => void; isAppSidebarVisible: boolean }) => {
  return (
    <CustomIconButton
      data-testid={DATA_TEST_ID.TOGGLE_BUTTON}
      onClick={props.toggleAppSidebarCallBack}
      sx={{ padding: 0, marginRight: (theme) => theme.tabiyaSpacing.xs, height: "auto", alignSelf: "center" }}
      title={props.isAppSidebarVisible ? "Hide the navigation sidebar" : "Show the navigation sidebar"}
    >
      {props.isAppSidebarVisible ? (
        <ChevronLeft sx={{ padding: 0, margin: 0 }} />
      ) : (
        <ChevronRight sx={{ padding: 0, margin: 0 }} />
      )}
    </CustomIconButton>
  );
};
