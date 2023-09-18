import React, {useCallback, useEffect} from "react";
import ImportModelDialog, {CloseEvent, ImportData} from "src/import/ImportModelDialog";
import {ServiceError} from "src/error/error";
import ImportDirectorService from "src/import/importDirector.service";
import {useSnackbar} from "src/theme/SnackbarProvider/SnackbarProvider";
import {writeServiceErrorToLog} from "../error/logger";
import {Backdrop} from "src/theme/Backdrop/Backdrop";
import ModelsTable from "./components/modelTables/ModelsTable";
import {ModelInfoTypes} from "../modelInfo/modelInfoTypes";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import LocaleAPISpecs from "api-specifications/locale"
import ModelDirectoryHeader from './components/ModelDirectoryHeader/ModelDirectoryHeader';
import { ModelDirectoryContainer } from './ModelDirectory.styles';

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d63f"
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_PAGE: `model-directory-root-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`
}

const importDirectorService = new ImportDirectorService("https://dev.tabiya.tech/api");
const modelInfoService = new ModelInfoService("https://dev.tabiya.tech/api");
export const availableLocales: LocaleAPISpecs.Types.Payload[] = [{
  name: "South Africa",
  shortCode: "ZA",
  UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a"
}, {
  name: "Ethiopia",
  shortCode: "ETH",
  UUID: "1df3d395-2a3d-4334-8fec-9d990bc8e3e4"
}]

const ModelDirectory = () => {
  const [isImportDlgOpen, setImportDlgOpen] = React.useState(false);
  const [isBackDropShown, setBackDropShown] = React.useState(false);
  const [models, setModels] = React.useState([] as ModelInfoTypes.ModelInfo[]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);

  const {enqueueSnackbar} = useSnackbar()

  const showImportDialog = (b: boolean) => {
    setImportDlgOpen(b);
  }

  const handleModelInfoFetch = useCallback(() => {
    return modelInfoService.fetchAllModelsPeriodically((models) => {
      setModels(models);
      setIsLoadingModels(false);
    }, e => {
      enqueueSnackbar(`Failed to fetch the models. Please check your internet connection.`, {variant: "error"})
      if (e instanceof ServiceError) {
        writeServiceErrorToLog(e, console.error);
      } else {
        console.error(e);
      }
    });
  }, [enqueueSnackbar]);

  const handleOnImportDialogClose = async (event: CloseEvent) => {
    showImportDialog(false);
    if (event.name === "IMPORT") {
      setBackDropShown(true);
      const importData = event.importData as ImportData;
      try {
        const newModel = await importDirectorService.directImport(
          importData.name,
          importData.description,
          importData.locale,
          importData.selectedFiles
        ) as any;
        enqueueSnackbar(`The model '${importData.name}' import has started.`, {variant: "success"});
        setModels([newModel, ...models]);
      } catch (e) {
        enqueueSnackbar(`The model '${importData.name}' import could not be started. Please try again.`, {variant: "error"})
        if (e instanceof ServiceError) {
          writeServiceErrorToLog(e, console.error);
        } else {
          console.error(e);
        }
      } finally {
        setBackDropShown(false);
      }
    }
  };

  useEffect(() => {
    const timerId = handleModelInfoFetch();

    return () => {
      clearInterval(timerId);
    };
  }, [handleModelInfoFetch]);


  return (
    <ModelDirectoryContainer
      data-testid={DATA_TEST_ID.MODEL_DIRECTORY_PAGE}
    >
      <ModelDirectoryHeader onModalImport={() => showImportDialog(true)} />
      <div className='model-table-container'>
        <ModelsTable models={models} isLoading={isLoadingModels} />
      </div>
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
          message='The model is being created and the files uploaded. Please wait ... '
        />
      )}
    </ModelDirectoryContainer>
  );
};
export default ModelDirectory;
