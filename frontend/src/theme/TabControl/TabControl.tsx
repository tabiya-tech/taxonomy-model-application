import { TabControlConfig } from "./TabControl.types";
import React from "react";

export interface TabControlProps {
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
  return (
    <div data-testid={props["data-testid"]}>
      <div data-testid={DATA_TEST_ID.TAB_CONTROL_LABEL}></div>
      <div data-testid={DATA_TEST_ID.TAB_CONTROL_PANEL}></div>
    </div>
  );
};

export default TabControl;
