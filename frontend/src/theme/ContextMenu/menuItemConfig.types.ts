import { ReactNode } from "react";

export type MenuItemConfig = {
  id: string;
  text: string;
  icon?: ReactNode;
  disabled: boolean;
  action: () => void;
};
