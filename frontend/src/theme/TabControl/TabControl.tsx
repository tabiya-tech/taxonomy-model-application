import { TabControlConfig } from "./TabControl.types";
import React, { useState } from "react";
import { Box, Tab, Tabs, useTheme } from "@mui/material";

interface StyledTabsProps {
  children?: React.ReactNode;
  "aria-label": string;
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const StyledTabs = (props: StyledTabsProps) => (
  <Tabs
    {...props}
    variant="fullWidth"
    sx={{
      backgroundColor: (theme) => theme.palette.common.white,
      position: "sticky",
      top: 0,
      zIndex: 1,
      "& .MuiTabs-indicator": {
        display: "flex",
        justifyContent: "center",
        backgroundColor: "transparent",
      },
      "& .MuiTabs-indicatorSpan": {
        maxWidth: 40,
        width: "100%",
        backgroundColor: (theme) => theme.palette.primary.main,
      },
    }}
    TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
  />
);

export interface TabControlProps {
  "aria-label": string;
  items: TabControlConfig[];
  "data-testid": string;
}

/**
 * TabControl responsible for rendering tabs and content given a list of TabControlConfig items
 * @param items a list of TabControlConfig items with an id, label and panel component
 * @param props gets a data-testid for testing from parent
 * @constructor
 */

const uniqueId = "c356cfd6-5a7a-4471-9ef3-4c1932251bcc";
export const DATA_TEST_ID = {
  TAB_CONTROL_LABEL: `tab-control-tabs-${uniqueId}`,
  TAB_CONTROL_PANEL: `tab-control-panel-${uniqueId}`,
};

const TabControl: React.FC<TabControlProps> = (props: Readonly<TabControlProps>) => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const theme = useTheme();
  return (
    <Box display="flex" flexDirection={"column"} sx={{ height: "100%" }} data-testid={props["data-testid"]}>
      <StyledTabs value={value} onChange={handleChange} aria-label={props["aria-label"]}>
        {props.items.map((item, index) => (
          <Tab
            sx={{
              ...theme.typography.button,
            }}
            label={item.label}
            key={item.id}
            data-testid={DATA_TEST_ID.TAB_CONTROL_LABEL}
            id={`tab-${item.id}`}
          />
        ))}
      </StyledTabs>
      {props.items.map((item, index) => (
        <Box
          role="tabpanel"
          hidden={value !== index}
          id={`tabpanel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          key={item.id}
          data-testid={DATA_TEST_ID.TAB_CONTROL_PANEL}
          sx={{
            paddingBottom: (theme) => theme.spacing(theme.tabiyaSpacing.lg),
            maxHeight: "100%",
            paddingTop: (theme) => theme.spacing(theme.tabiyaSpacing.lg),
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {value === index && <Box>{item.panel}</Box>}
        </Box>
      ))}
    </Box>
  );
};

export default TabControl;
