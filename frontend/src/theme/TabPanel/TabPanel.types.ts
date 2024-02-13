import { ReactNode } from "react";

export type TabPanelConfig = {
  id: string;
  tabLabel: string;
  panelComponent?: ReactNode;
  disabled: boolean;
};
