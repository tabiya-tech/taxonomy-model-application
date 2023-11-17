import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ModelInfo = ModelInfoTypes.ModelInfo;
import React, { useContext, useEffect, useState } from "react";
import { IsOnlineContext } from "src/app/providers";

export const isModelNotSuccessfullyImported = (model: ModelInfo) => {
  return (
    model?.importProcessState?.status !== ImportProcessStateAPISpecs.Enums.Status.COMPLETED ||
    model?.importProcessState?.result.errored !== false
  );
};

export function useMenuService() {
  const isOnline = useContext(IsOnlineContext);
  const [menuState, setMenuState] = useState<{
    anchorEl: HTMLElement | null;
    open: boolean;
    isExportDisabled: boolean;
  }>({
    anchorEl: null,
    open: false,
    isExportDisabled: !isOnline,
  });
  const [model, setModel] = useState<ModelInfo | null>(null);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, model: ModelInfo) => {
    setMenuState({
      anchorEl: event.currentTarget,
      open: true,
      isExportDisabled: !isOnline || isModelNotSuccessfullyImported(model),
    });
    setModel(model);
  };

  const closeMenu = () => {
    setMenuState({
      anchorEl: null,
      open: false,
      isExportDisabled: !isOnline,
    });
    setModel(null);
  };

  useEffect(() => {
    if (!isOnline) {
      setMenuState((prevState) => ({
        ...prevState,
        isExportDisabled: true,
      }));
    } else {
      setMenuState((prevState) => ({
        ...prevState,
        isExportDisabled: isModelNotSuccessfullyImported(model!),
      }));
    }
  }, [isOnline, model]);

  return {
    menuState,
    model,
    openMenu,
    closeMenu,
  };
}
