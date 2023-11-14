import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ModelInfo = ModelInfoTypes.ModelInfo;
import React, { useState } from "react";

export const getModelDisabledState = (model: ModelInfo) => {
  return (
    model?.importProcessState?.status !== ImportProcessStateAPISpecs.Enums.Status.COMPLETED ||
    model?.importProcessState?.result.errored !== false
  );
};

export function useMenuService() {
  const [menuState, setMenuState] = useState<{
    anchorEl: HTMLElement | null;
    model: ModelInfo | null;
    open: boolean;
    isExportDisabled?: boolean;
  }>({
    anchorEl: null,
    model: null,
    open: false,
    isExportDisabled: false,
  });

  const openMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, model: ModelInfo) => {
    setMenuState({
      anchorEl: event.currentTarget,
      model,
      open: true,
      isExportDisabled: getModelDisabledState(model),
    });
  };

  const closeMenu = () => {
    setMenuState({
      anchorEl: null,
      model: null,
      open: false,
    });
  };

  return {
    menuState,
    openMenu,
    closeMenu,
  };
}
