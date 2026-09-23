import React, { useContext, useEffect } from "react";
import ImportModelDialog, { CloseEvent as ImportModelDialogCloseEvent, ImportData } from "src/import/ImportModelDialog";
import { getUserFriendlyErrorMessage, ServiceError } from "src/error/error";
import ImportDirectorService from "src/import/importDirector.service";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { writeServiceErrorToLog } from "src/error/logger";
import { Backdrop } from "src/theme/Backdrop/Backdrop";
import ModelsCardList from "./components/ModelsCardList/ModelsCardList";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import { useModels, MODELS_QUERY_KEY } from "src/modelInfo/useModels";
import { queryClient } from "src/app/providers/QueryProvider";
import LocalesService from "src/locale/locales.service";
import LocaleAPISpecs from "api-specifications/locale";
import ModelDirectoryHeader from "./components/ModelDirectoryHeader/ModelDirectoryHeader";
import ContentLayout from "src/theme/ContentLayout/ContentLayout";
import { IsOnlineContext } from "src/app/providers";
import ExportService from "src/export/export.service";
import ModelPropertiesDrawer, {
  CloseEvent as DrawerCloseEvent,
} from "./components/ModelProperties/ModelPropertiesDrawer";
import { getApiUrl, getLocalesUrl } from "src/envService";
import { useNavigate, generatePath } from "react-router-dom";
import { routerPaths } from "src/app/routerPaths";

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d63f";
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_PAGE: `model-directory-root-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`,
};

export const SNACKBAR_ID = {
  INTERNET_ERROR: `internet-error-${uniqueId}`,
};
const importDirectorService = new ImportDirectorService(getApiUrl());
const modelInfoService = new ModelInfoService(getApiUrl());
const exportService = new ExportService(getApiUrl());
const localesService = new LocalesService(getLocalesUrl());

const ModelDirectory = () => {
  const navigate = useNavigate();
  const [isImportDlgOpen, setIsImportDlgOpen] = React.useState(false);
  const [isBackDropShown, setIsBackDropShown] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const [drawerModel, setDrawerModel] = React.useState<ModelInfoTypes.ModelInfo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const [isImportModelLoading, setIsImportModelLoading] = React.useState(false);
  const [locales, setLocales] = React.useState([] as LocaleAPISpecs.Types.Payload[]);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const isOnline = useContext(IsOnlineContext);

  const { data: models = [], isPending: isLoadingModels, isError, error } = useModels({ enabled: isOnline });

  useEffect(() => {
    if (isError) {
      const message = getUserFriendlyErrorMessage(error);
      enqueueSnackbar(message, {
        variant: "error",
        key: SNACKBAR_ID.INTERNET_ERROR,
        preventDuplicate: true,
      });
      if (error instanceof ServiceError) {
        writeServiceErrorToLog(error, console.error);
      } else {
        console.error(error);
      }
    } else {
      closeSnackbar(SNACKBAR_ID.INTERNET_ERROR);
    }
  }, [isError, error, enqueueSnackbar, closeSnackbar]);

  const showImportDialog = (b: boolean) => {
    setIsImportDlgOpen(b);
  };

  const handleOpenModelDialog = async () => {
    setIsImportModelLoading(true);
    try {
      const data = await localesService.getLocales();
      setLocales(data);
      showImportDialog(true);
    } catch (error) {
      if (error instanceof ServiceError) {
        writeServiceErrorToLog(error, console.error);
      } else {
        console.error(error);
      }
    } finally {
      setIsImportModelLoading(false);
    }
  };

  const handleNotifyOnShowModelDetails = (modelId: string) => {
    const modelToShow = models.find((model) => model.id === modelId);
    if (!modelToShow) {
      enqueueSnackbar(
        "The selected model could not be found. Please try again. If the problem persists, clear your browser's cache and refresh the page.",
        {
          variant: "error",
          preventDuplicate: true,
        }
      );
      return;
    }
    setDrawerModel(modelToShow);
    setIsDrawerOpen(true);
  };
  const handleNotifyOnModelDrawerClose = (_event: DrawerCloseEvent) => {
    // We keep the previous drawerModel so that during the drawer animation it keeps the model
    setIsDrawerOpen(false);
  };

  const handleNotifyOnExplore = (modelId: string) => {
    navigate(generatePath(routerPaths.EXPLORER_OCCUPATIONS, { modelId }));
  };

  const handleOnImportDialogClose = async (event: ImportModelDialogCloseEvent) => {
    showImportDialog(false);
    if (event.name === "IMPORT") {
      setMessage("The model is being created and the files uploaded. Please wait ... ");
      setIsBackDropShown(true);
      const importData = event.importData as ImportData;
      try {
        const newModel = await importDirectorService.directImport(
          importData.name,
          importData.description,
          importData.license,
          importData.locale,
          importData.selectedFiles,
          importData.UUIDHistory,
          importData.availableLanguages,
          importData.isOriginalESCOModel
        );
        enqueueSnackbar(`The model '${importData.name}' import has started.`, {
          variant: "success",
        });
        queryClient.setQueryData(MODELS_QUERY_KEY, (previousModels: ModelInfoTypes.ModelInfo[] = []) => [
          newModel,
          ...previousModels,
        ]);
      } catch (e) {
        enqueueSnackbar(`The model '${importData.name}' import could not be started. Please try again.`, {
          variant: "error",
        });
        if (e instanceof ServiceError) {
          writeServiceErrorToLog(e, console.error);
        } else {
          console.error(e);
        }
      } finally {
        setIsBackDropShown(false);
      }
    }
  };

  const handleNotifyOnExport = async (modelId: string) => {
    setMessage("The model is being exported. Please wait ...");
    setIsBackDropShown(true);
    const modelName = models.find((model) => model.id === modelId)?.name;
    try {
      await exportService.exportModel(modelId);
      enqueueSnackbar(`The model '${modelName}' export has started.`, {
        variant: "success",
        preventDuplicate: true,
      });
      // exportModel doesn't return the updated model, so refetch to pick up its new process state and resume polling
      await queryClient.refetchQueries({ queryKey: MODELS_QUERY_KEY });
    } catch (e) {
      enqueueSnackbar(`The model '${modelName}' export could not be started. Please try again.`, {
        variant: "error",
        preventDuplicate: true,
      });
      if (e instanceof ServiceError) {
        writeServiceErrorToLog(e, console.error);
      } else {
        console.error(e);
      }
    } finally {
      setIsBackDropShown(false);
    }
  };

  const handleNotifyOnRelease = async (modelId: string, releaseNotes?: string) => {
    setMessage("The model is being released. Please wait ...");
    setIsBackDropShown(true);
    const modelName = models.find((model) => model.id === modelId)?.name;
    try {
      const updatedModel = await modelInfoService.releaseModel(modelId, releaseNotes);
      queryClient.setQueryData(MODELS_QUERY_KEY, (previousModels: ModelInfoTypes.ModelInfo[] = []) =>
        previousModels.map((model) => (model.id === modelId ? updatedModel : model))
      );
      if (drawerModel?.id === modelId) {
        setDrawerModel(updatedModel);
      }
      enqueueSnackbar(`The model '${modelName}' has been released.`, {
        variant: "success",
        preventDuplicate: true,
      });
    } catch (e) {
      enqueueSnackbar(`The model '${modelName}' could not be released. Please try again.`, {
        variant: "error",
        preventDuplicate: true,
      });
      if (e instanceof ServiceError) {
        writeServiceErrorToLog(e, console.error);
      } else {
        console.error(e);
      }
    } finally {
      setIsBackDropShown(false);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }} data-testid={DATA_TEST_ID.MODEL_DIRECTORY_PAGE}>
      <ContentLayout
        headerComponent={
          <ModelDirectoryHeader onModelImport={handleOpenModelDialog} isImportModelLoading={isImportModelLoading} />
        }
        mainComponent={
          <ModelsCardList
            models={models}
            isLoading={isLoadingModels}
            notifyOnExport={handleNotifyOnExport}
            notifyOnShowModelDetails={handleNotifyOnShowModelDetails}
            notifyOnExplore={handleNotifyOnExplore}
            notifyOnRelease={handleNotifyOnRelease}
          />
        }
      >
        {isImportDlgOpen && (
          <ImportModelDialog
            isOpen={isImportDlgOpen}
            availableLocales={locales}
            notifyOnClose={handleOnImportDialogClose}
          />
        )}
        {isBackDropShown && <Backdrop isShown={isBackDropShown} message={message} />}
        <ModelPropertiesDrawer
          isOpen={isDrawerOpen}
          notifyOnClose={handleNotifyOnModelDrawerClose}
          model={drawerModel}
        />
      </ContentLayout>
    </div>
  );
};
export default ModelDirectory;
