import { ReactNode } from "react";
import AuthAPISpecs from "api-specifications/auth";

export type MenuItemConfig = {
  id: string;
  text: string;
  icon?: ReactNode;
  disabled: boolean;
  action: () => void;
  role?: AuthAPISpecs.Enums.TabiyaRoles;
};
