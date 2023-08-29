import React, {useCallback, useEffect} from "react";
import {Box, Button, Container} from '@mui/material';
import ImportModelDialog, {CloseEvent, ImportData} from "src/import/ImportModelDialog";
import {ServiceError} from "src/error/error";
import ImportDirectorService from "src/import/importDirector.service";
import {useSnackbar} from "src/theme/SnackbarProvider/SnackbarProvider";
import {writeServiceErrorToLog} from "../error/logger";
import {ILocale} from "api-specifications/modelInfo";
import {Backdrop} from "src/theme/Backdrop/Backdrop";
import ModelsTable from "./components/modelTables/ModelsTable";
import {ModelDirectoryTypes} from "./modelDirectory.types";
import ModelInfoService from "./modelInfo/modelInfo.service";

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d63f"
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_PAGE: `model-directory-root-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`
}

const importDirectorService = new ImportDirectorService("https://dev.tabiya.tech/api");
const modelInfoService = new ModelInfoService("https://dev.tabiya.tech/api");
export const availableLocales: ILocale[] = [{
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
  const [models, setModels] = React.useState([] as ModelDirectoryTypes.ModelInfo[]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);

  const {enqueueSnackbar} = useSnackbar()
  const showImportDialog = (b: boolean) => {
    setImportDlgOpen(b);
  }

  const handleModelInfoFetch = useCallback(async () => {
    try {
      return await modelInfoService.getAllModels();
    } catch (e) {
      enqueueSnackbar(`Failed to fetch the models. Please check your internet connection.`, {variant: "error"})
      if (e instanceof ServiceError) {
        writeServiceErrorToLog(e, console.error);
      } else {
        console.error(e);
      }
    }
  }, [enqueueSnackbar]);

  const handleOnImportDialogClose = async (event: CloseEvent) => {
    showImportDialog(false);
    if (event.name === "IMPORT") {
      setBackDropShown(true);
      const importData = event.importData as ImportData;
      try {
        const modelID = await importDirectorService.directImport(
          importData.name,
          importData.description,
          importData.locale,
          importData.selectedFiles
        );
        enqueueSnackbar(`The model '${importData.name}' import has started.`, {variant: "success"})
        console.log("Created model: " + modelID);
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
    handleModelInfoFetch().then((modelInfos) => {
      modelInfos && setModels(modelInfos);
    }).finally(() => {
      setIsLoadingModels(false)
    });
  }, [handleModelInfoFetch]);

  return <Container maxWidth="xl" sx={{
    width: "100%", height: "100vh", justifyContent: 'center', alignItems: 'center', display: 'flex'
  }} data-testid={DATA_TEST_ID.MODEL_DIRECTORY_PAGE}>
    <Box display="flex" flexDirection="column" alignItems='flex-end'  height="100vh" width="100vw">
      <Box>
        <Button onClick={() => showImportDialog(true)} data-testid={DATA_TEST_ID.IMPORT_MODEL_BUTTON}
                style={{width: "auto"}}>
          Import Model
        </Button>
      </Box>
      <ModelsTable models={models} isLoading={isLoadingModels}/>
    </Box>
    {isImportDlgOpen && <ImportModelDialog isOpen={isImportDlgOpen} availableLocales={availableLocales}
                                           notifyOnClose={handleOnImportDialogClose}/>}
    {isBackDropShown && <Backdrop isShown={isBackDropShown}
                                  message="The model is being created and the files uploaded. Please wait ... "/>}
  </Container>
};
export default ModelDirectory;
