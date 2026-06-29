import React from "react";
import Box from "@mui/material/Box";

const uniqueId = "b2e4f6a8-1c3d-4e5f-9a7b-0d2e4c6f8a1b";
export const DATA_TEST_ID = {
  EXPLORER_LAYOUT: `explorer-layout-${uniqueId}`,
  EXPLORER_LAYOUT_HEADER: `explorer-layout-header-${uniqueId}`,
  EXPLORER_LAYOUT_LEFT_PANEL: `explorer-layout-left-panel-${uniqueId}`,
  EXPLORER_LAYOUT_RIGHT_PANEL: `explorer-layout-right-panel-${uniqueId}`,
};

type ExplorerLayoutProps = {
  headerComponent: React.ReactNode;
  leftPanelComponent: React.ReactNode;
  rightPanelComponent: React.ReactNode;
};

const ExplorerLayout = ({
  headerComponent,
  leftPanelComponent,
  rightPanelComponent,
}: Readonly<ExplorerLayoutProps>) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      width="100%"
      overflow="hidden"
      data-testid={DATA_TEST_ID.EXPLORER_LAYOUT}
    >
      <Box flexShrink={0} data-testid={DATA_TEST_ID.EXPLORER_LAYOUT_HEADER}>
        {headerComponent}
      </Box>

      <Box display="flex" flexDirection="row" flex={1} overflow="hidden">
        <Box
          flexShrink={0}
          width="35%"
          height="100%"
          overflow="auto"
          data-testid={DATA_TEST_ID.EXPLORER_LAYOUT_LEFT_PANEL}
        >
          {leftPanelComponent}
        </Box>

        <Box flex={1} height="100%" overflow="auto" data-testid={DATA_TEST_ID.EXPLORER_LAYOUT_RIGHT_PANEL}>
          {rightPanelComponent}
        </Box>
      </Box>
    </Box>
  );
};

export default ExplorerLayout;
