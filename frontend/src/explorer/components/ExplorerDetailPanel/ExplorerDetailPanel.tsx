import { useState } from "react";
import Box from "@mui/material/Box";
import { Typography, Divider, Skeleton, Tabs, Tab } from "@mui/material";

const uniqueId = "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a";
export const DATA_TEST_ID = {
  EXPLORER_DETAIL_PANEL: `explorer-detail-panel-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_EMPTY: `explorer-detail-panel-empty-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_CODE: `explorer-detail-panel-code-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_TITLE: `explorer-detail-panel-title-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_SKELETON: `explorer-detail-panel-skeleton-${uniqueId}`,
};

export type ExplorerDetailItem = {
  id: string;
  code: string;
  title: string;
  definition?: string;
};

type ExplorerDetailPanelProps = {
  item: ExplorerDetailItem | null;
  isLoading?: boolean;
};

const DetailSkeleton = () => (
  <Box
    display="flex"
    flexDirection="column"
    height="100%"
    overflow="hidden"
    data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_SKELETON}
  >
    <Box display="flex" alignItems="flex-start" gap={2} px={3} py={2.5} flexShrink={0}>
      <Skeleton variant="text" width={80} height={44} />
      <Skeleton variant="text" width={300} height={44} />
    </Box>
    <Divider />
    <Box display="flex" gap={1} px={2} pt={0.5} flexShrink={0}>
      <Skeleton variant="text" width={88} height={44} />
      <Skeleton variant="text" width={60} height={44} />
      <Skeleton variant="text" width={68} height={44} />
      <Skeleton variant="text" width={68} height={44} />
    </Box>
    <Box px={3} pt={2} display="flex" flexDirection="column" gap={1.5}>
      <Skeleton variant="text" width={80} height={20} />
      <Skeleton variant="text" width="90%" height={18} />
      <Skeleton variant="text" width="85%" height={18} />
      <Skeleton variant="text" width="60%" height={18} />
    </Box>
  </Box>
);

const TAB_LABELS = ["Definition", "Links", "Details", "History"];

const ExplorerDetailPanel = ({ item, isLoading = false }: Readonly<ExplorerDetailPanelProps>) => {
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!item) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
        data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_EMPTY}
      >
        <Typography variant="body1" color="text.secondary">
          Select an item to view its details
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
      data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL}
    >
      <Box display="flex" alignItems="flex-start" gap={2} px={3} py={2.5} flexShrink={0}>
        <Typography
          variant="h5"
          color="grey.500"
          fontWeight={400}
          sx={{ flexShrink: 0, lineHeight: 1.4 }}
          data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_CODE}
        >
          {item.code}
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="primary"
          data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_TITLE}
        >
          {item.title}
        </Typography>
      </Box>
      <Divider />
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        TabIndicatorProps={{
          sx: {
            backgroundColor: "success.dark",
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          },
        }}
        sx={{
          flexShrink: 0,
          px: 1,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            minWidth: 80,
            color: "text.secondary",
            "&.Mui-selected": {
              color: "success.dark",
            },
          },
        }}
      >
        {TAB_LABELS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      <Box flex={1} overflow="auto" px={3} py={2}>
        {activeTab === 0 && (
          <>
            <Typography variant="body2" fontWeight="bold" mb={1}>
              Description
            </Typography>
            <Typography variant="body2">{item.definition ?? "No definition available"}</Typography>
          </>
        )}
        {activeTab === 1 && (
          <Typography variant="body2" color="text.secondary">
            Links will be shown here
          </Typography>
        )}
        {activeTab === 2 && (
          <Typography variant="body2" color="text.secondary">
            Details will be shown here
          </Typography>
        )}
        {activeTab === 3 && (
          <Typography variant="body2" color="text.secondary">
            History will be shown here
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ExplorerDetailPanel;
