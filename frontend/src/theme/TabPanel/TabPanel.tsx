import { TabPanelConfig } from "./TabPanel.types";

export interface TabPanelProps {
  items: TabPanelConfig[];
}

/**
 * TabPanel responsible for rendering tabs and content given a list of TabPanelConfig items
 * with a tabLabel and a panelComponent
 * @param props
 * @constructor
 */
function TabPanel(props: Readonly<TabPanelProps>) {
  return <></>;
}

export default TabPanel;
