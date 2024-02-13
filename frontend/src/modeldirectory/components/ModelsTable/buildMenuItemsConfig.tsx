import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ModelInfo = ModelInfoTypes.ModelInfo;
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { MenuItemConfig } from "src/theme/ContextMenu/menuItemConfig.types";
import DescriptionIcon from "@mui/icons-material/Description";

export const MENU_ITEM_ID = ["export-model", "show-model-details"];
export const MENU_ITEM_TEXT = ["Export", "Show Details"];

export const MENU_ITEM_INDEX = {
  EXPORT_MODEL: 0,
  SHOW_MODEL_DETAILS: 1,
};

export default function buildMenuItemsConfig(
  modelInfo: ModelInfo,
  handlers: {
    handleExport: (modelId: string) => void;
    handleShowModelDetails: (modelId: string) => void;
  },
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
    action: () => handlers.handleExport(modelInfo.id),
    disabled: !isOnline || !isImportSuccessful(),
  };

  // Show model details
  items[MENU_ITEM_INDEX.SHOW_MODEL_DETAILS] = {
    id: MENU_ITEM_ID[MENU_ITEM_INDEX.SHOW_MODEL_DETAILS],
    text: MENU_ITEM_TEXT[MENU_ITEM_INDEX.SHOW_MODEL_DETAILS],
    icon: <DescriptionIcon />,
    action: () => handlers.handleShowModelDetails(modelInfo.id),
    disabled: false,
  };

  return items;
}
