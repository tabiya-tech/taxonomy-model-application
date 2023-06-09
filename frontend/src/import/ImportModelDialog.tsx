import React, {KeyboardEvent, useRef} from "react";
import {
  Button,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, useMediaQuery, useTheme
} from '@mui/material';
import {ILocale} from "api-specifications/modelInfo";
import ImportFilesSelection from "./components/ImportFilesSelection";
import ModelNameField from "./components/ModelNameField";
import ModelDescriptionField from "./components/ModelDescriptionField";
import {ImportFileTypes} from "api-specifications/import";
import {useStyles} from "src/theme/global.style";
import CancelButton from "src/theme/CancelButton/CancelButton";
import {ImportFiles} from "./ImportFiles.type";
import ModelLocalSelectField from "./components/ModelLocalSelectField";

const uniqueId = "72be571e-b635-4c15-85c6-897dab60d59f"
export const DATA_TEST_ID = {
  IMPORT_MODEL_DIALOG: `import-model-dialog-${uniqueId}`,
  IMPORT_BUTTON: `import-button-${uniqueId}`,
  CANCEL_BUTTON: `cancel-button-${uniqueId}`
}

export interface ImportData {
  name: string,
  description: string,
  locale: ILocale,
  selectedFiles: ImportFiles
}

export type CloseEvent = { name: "CANCEL" | "IMPORT", importData?: ImportData };

export interface ImportModelDialogProps {
  isOpen: boolean, // if true, the dialog is open/shown
  availableLocales: ILocale[],
  notifyOnClose: (event: CloseEvent) => void // callback function to notify the parent component when the dialog should close
}

const ImportModelDialog = (props: ImportModelDialogProps) => {
  // state to enable disabling the import button when the user has not selected all the required files
  const [isImportButtonDisabled, setIsImportButtonDisabled] = React.useState(true);

  const handleClose = (event: CloseEvent) => {
    props.notifyOnClose(event);
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { // Check for the ESC key code
      handleClose({name: "CANCEL"});
    }
  };

  const data = useRef<ImportData>({
    name: "",
    description: "",
    locale: {} as any,
    selectedFiles: {}
  })

  const handleNameChange = (newName: string) => {
    data.current.name = newName;
    validateData();
  }

  const handleLocaleChange = (newLocale: ILocale) => {
    data.current.locale = {...newLocale};
    validateData();
  }

  const handleDescriptionChange = (newDescription: string) => {
    data.current.description = newDescription;
  }

  const handleSelectedFileChange = (fileType: ImportFileTypes, file: File | null) => {
    if (file === null) {
      delete data.current.selectedFiles[fileType];
    } else {
      data.current.selectedFiles[fileType] = file;
    }
    validateData();
  }

  // function to validate the data that the user has entered
  const validateData = () => {
    const currentData = data.current;
    const invalid: boolean = (currentData.name.length === 0 || Object.keys(currentData.selectedFiles).length === 0 || currentData.locale === undefined);
    setIsImportButtonDisabled(invalid);
  }

  const classes = useStyles();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return <Dialog open={props.isOpen} onKeyDown={handleKeyDown} fullWidth={true} fullScreen={fullScreen}
                 maxWidth='sm' data-testid={DATA_TEST_ID.IMPORT_MODEL_DIALOG}>
    <DialogTitle>Import Model</DialogTitle>
    <DialogContent>
      <Stack className={classes.customStack} spacing={5}>
        <ModelNameField notifyModelNameChanged={handleNameChange}/>
        <ModelLocalSelectField locales={props.availableLocales} notifyModelLocaleChanged={handleLocaleChange}/>
        <ModelDescriptionField notifyModelDescriptionChanged={handleDescriptionChange}/>
        <ImportFilesSelection notifySelectedFileChange={handleSelectedFileChange}/>
      </Stack>
    </DialogContent>
    <DialogActions>
      <CancelButton onClick={() => {
        handleClose({name: "CANCEL"})
      }} data-testid={DATA_TEST_ID.CANCEL_BUTTON}/>
      <Button onClick={() => handleClose({name: "IMPORT", importData: data.current})}
              disabled={isImportButtonDisabled}
              data-testid={DATA_TEST_ID.IMPORT_BUTTON}>Import</Button>
    </DialogActions>
  </Dialog>
};
export default ImportModelDialog;