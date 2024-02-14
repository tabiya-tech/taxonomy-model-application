import { ReactNode } from "react";

/**
 *  TabControlConfig takes an id, label, and panel
 *  @param id - the id of the tab, should be a unique string for each tab, used as list keys
 *  @param label - the label of the tab, the tab name
 *  @param panel - the panel of the tab, a react component to be rendered when the tab is active
 */
export type TabControlConfig = {
  id: string;
  label: string;
  panel?: ReactNode;
};
