import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ModelInfo = ModelInfoTypes.ModelInfo;
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { MenuItemConfig } from "src/theme/ContextMenu/menuItemConfig.types";

export const MENU_ITEM_ID = ["export-model"];
export const MENU_ITEM_TEXT = ["Export"];

export const MENU_ITEM_INDEX = {
  EXPORT_MODEL: 0,
};

export default function buildMenuItemsConfig(
  modelInfo: ModelInfo,
  handleExport: (modelId: string) => void,
  isOnline: boolean
): MenuItemConfig[] {
  const isImportSuccessful = () => {
    return (
      modelInfo.importProcessState.status === ImportProcessStateAPISpecs.Enums.Status.COMPLETED &&
      !modelInfo.importProcessState.result.errored
    );
  };

  const items = new Array<MenuItemConfig>();
  // Export
  items[MENU_ITEM_INDEX.EXPORT_MODEL] = {
    id: MENU_ITEM_ID[MENU_ITEM_INDEX.EXPORT_MODEL],
    text: MENU_ITEM_TEXT[MENU_ITEM_INDEX.EXPORT_MODEL],
    icon: <CloudDownloadIcon />,
    action: () => handleExport(modelInfo.id),
    disabled: !isOnline || !isImportSuccessful(),
  };

  return items;
}
