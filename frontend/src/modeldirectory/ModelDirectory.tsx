import React, { useCallback, useContext, useEffect } from "react";
import ImportModelDialog, { CloseEvent, ImportData } from "src/import/ImportModelDialog";
import { ServiceError, getUserFriendlyErrorMessage } from "src/error/error";
import ImportDirectorService from "src/import/importDirector.service";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { writeServiceErrorToLog } from "src/error/logger";
import { Backdrop } from "src/theme/Backdrop/Backdrop";
import ModelsTable from "./components/modelTables/ModelsTable";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import LocaleAPISpecs from "api-specifications/locale";
import ModelDirectoryHeader from "./components/ModelDirectoryHeader/ModelDirectoryHeader";
import ContentLayout from "src/theme/ContentLayout/ContentLayout";
import { IsOnlineContext } from "src/app/providers";

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d63f";
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_PAGE: `model-directory-root-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`,
};

export const SNACKBAR_ID = {
  INTERNET_ERROR: `internet-error-${uniqueId}`,
};
const importDirectorService = new ImportDirectorService("https://dev.tabiya.tech/api");
const modelInfoService = new ModelInfoService("https://dev.tabiya.tech/api");
export const availableLocales: LocaleAPISpecs.Types.Payload[] = [
  {
    name: "South Africa",
    shortCode: "ZA",
    UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a",
  },
  {
    name: "Ethiopia",
    shortCode: "ETH",
    UUID: "1df3d395-2a3d-4334-8fec-9d990bc8e3e4",
  },
];

const ModelDirectory = () => {
  const [isImportDlgOpen, setIsImportDlgOpen] = React.useState(false);
  const [isBackDropShown, setIsBackDropShown] = React.useState(false);
  const [models, setModels] = React.useState([] as ModelInfoTypes.ModelInfo[]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const isOnline = useContext(IsOnlineContext);

  const showImportDialog = (b: boolean) => {
    setIsImportDlgOpen(b);
  };

  function modelArraysAreEqual(m1: ModelInfoTypes.ModelInfo[], m2: ModelInfoTypes.ModelInfo[]) {
    if (m1.length !== m2.length) {
      return false; // Different lengths, not equal
    }

    for (let i = 0; i < m1.length; i++) {
      const obj1 = m1[i];
      const obj2 = m2[i];
      if (JSON.stringify(obj1) !== JSON.stringify(obj2)) {
        return false; // Objects are not equal
      }
    }

    return true; // Arrays are equal
  }

  const handleModelInfoFetch = useCallback(() => {
    if (isOnline) {
      return modelInfoService.fetchAllModelsPeriodically(
        (fetchedModels) => {
          if (!modelArraysAreEqual(fetchedModels, models)) {
            setModels(fetchedModels);
          }
          setIsLoadingModels(false);
          closeSnackbar(SNACKBAR_ID.INTERNET_ERROR);
        },
        (e) => {
          const message = getUserFriendlyErrorMessage(e);
          enqueueSnackbar(message, {
            variant: "error",
            key: SNACKBAR_ID.INTERNET_ERROR,
            preventDuplicate: true,
          });
          if (e instanceof ServiceError) {
            writeServiceErrorToLog(e, console.error);
          } else {
            console.error(e);
          }
        }
      );
    }
    // It is important to pass models as a dependency otherwise the callback will always
    // use the initial value of models, which is [], and the modelArrayAreEqual will always return false
    // this has the side effect that when the models are updated, the callback is created again.
    // This is not a problem because the useEffect is designed to handle this,
    // by clearing the interval when the component is unmounted and also when the interval is recreated
  }, [models, enqueueSnackbar, closeSnackbar, isOnline]);

  useEffect(() => {
    const timerId = handleModelInfoFetch();
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [handleModelInfoFetch]);

  const handleOnImportDialogClose = async (event: CloseEvent) => {
    showImportDialog(false);
    if (event.name === "IMPORT") {
      setIsBackDropShown(true);
      const importData = event.importData as ImportData;
      try {
        const newModel = (await importDirectorService.directImport(
          importData.name,
          importData.description,
          importData.locale,
          importData.selectedFiles
        )) as any;
        enqueueSnackbar(`The model '${importData.name}' import has started.`, {
          variant: "success",
        });
        setModels([newModel, ...models]);
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

  return (
    <div style={{ width: "100%", height: "100%" }} data-testid={DATA_TEST_ID.MODEL_DIRECTORY_PAGE}>
      <ContentLayout
        headerComponent={<ModelDirectoryHeader onModelImport={() => showImportDialog(true)} />}
        mainComponent={<ModelsTable models={models} isLoading={isLoadingModels} />}
      >
        {isImportDlgOpen && (
          <ImportModelDialog
            isOpen={isImportDlgOpen}
            availableLocales={availableLocales}
            notifyOnClose={handleOnImportDialogClose}
          />
        )}
        {isBackDropShown && (
          <Backdrop
            isShown={isBackDropShown}
            message="The model is being created and the files uploaded. Please wait ... "
          />
        )}
      </ContentLayout>
    </div>
  );
};
export default ModelDirectory;
