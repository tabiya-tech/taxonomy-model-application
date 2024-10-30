import React, { KeyboardEvent, useRef, useState } from "react";
import {
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ImportFilesSelection from "./components/ImportFilesSelection";
import ModelNameField from "./components/ModelNameField";
import ModelDescriptionField from "./components/ModelDescriptionField";
import ImportAPISpecs from "api-specifications/import";
import CancelButton from "src/theme/CancelButton/CancelButton";
import { ImportFiles } from "./ImportFiles.type";
import ModelLocalSelectField from "./components/ModelLocalSelectField";
import LocaleAPISpecs from "api-specifications/locale";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import HelpTip from "src/theme/HelpTip/HelpTip";
import ApproveModal from "../theme/ApproveModal/ApproveModal";

const uniqueId = "72be571e-b635-4c15-85c6-897dab60d59f";
export const DATA_TEST_ID = {
  IMPORT_MODEL_DIALOG: `import-model-dialog-${uniqueId}`,
  IMPORT_ORIGINAL_ESCO_CHECKBOX: `import-original-esco-checkbox-${uniqueId}`,
  IMPORT_ORIGINAL_ESCO_CHECKBOX_LABEL: `import-original-esco-checkbox-label-${uniqueId}`,
  IMPORT_ORIGINAL_ESCO_CHECKBOX_TOOLTIP: `import-original-esco-checkbox-tooltip-${uniqueId}`,
  IMPORT_BUTTON: `import-button-${uniqueId}`,
  CANCEL_BUTTON: `cancel-button-${uniqueId}`,
};

export interface ImportData {
  name: string;
  description: string;
  license: string;
  locale: LocaleAPISpecs.Types.Payload;
  selectedFiles: ImportFiles;
  UUIDHistory: string[];
  isOriginalESCOModel: boolean;
}

export type CloseEvent = { name: "CANCEL" | "IMPORT"; importData?: ImportData };

export interface ImportModelDialogProps {
  isOpen: boolean; // if true, the dialog is open/shown
  availableLocales: LocaleAPISpecs.Types.Payload[];
  notifyOnClose: (event: CloseEvent) => void; // callback function to notify the parent component when the dialog should close
}

const ImportModelDialog = (props: Readonly<ImportModelDialogProps>) => {
  // state to enable disabling the import button when the user has not selected all the required files
  const [isImportButtonDisabled, setIsImportButtonDisabled] = React.useState(true);

  const [showApproveDescriptionOverride, setShowApproveDescriptionOverride] = useState(false);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const tempDescription = useRef<string>("");

  const handleClose = (event: CloseEvent) => {
    props.notifyOnClose(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      // Check for the ESC key code
      handleClose({ name: "CANCEL" });
    }
  };

  const data = useRef<ImportData>({
    name: "",
    description: "",
    locale: {} as any,
    selectedFiles: {},
    license: "",
    UUIDHistory: [],
    isOriginalESCOModel: false,
  });

  const handleNameChange = (newName: string) => {
    data.current.name = newName;
    validateData();
  };

  const handleLocaleChange = (newLocale: LocaleAPISpecs.Types.Payload) => {
    data.current.locale = { ...newLocale };
    validateData();
  };

  const handleDescriptionChange = (newDescription: string) => {
    data.current.description = newDescription;
  };

  const handleFromModelInfoDescriptionChange = (newDescription: string) => {
    if (!newDescription) return;

    if (data.current.description) {
      setShowApproveDescriptionOverride(true);
      tempDescription.current = newDescription;
      return;
    }

    data.current.description = newDescription;
    descriptionRef.current!.value = newDescription;
  };

  const handleUUIDHistoryChange = (newUUIDHistory: string[]) => {
    data.current.UUIDHistory = newUUIDHistory;
  };

  const handleLicenseChange = (newLicense: string) => {
    data.current.license = newLicense;
  };

  const handleOriginalESCOChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    data.current.isOriginalESCOModel = event.target.checked;
  };

  const handleSelectedFileChange = (fileType: ImportAPISpecs.Constants.ImportFileTypes, file: File | null) => {
    if (file === null) {
      delete data.current.selectedFiles[fileType];
    } else {
      data.current.selectedFiles[fileType] = file;
    }
    validateData();
  };

  // function to validate the data that the user has entered
  const validateData = () => {
    const currentData = data.current;
    const invalid: boolean =
      currentData.name.length === 0 ||
      Object.keys(currentData.selectedFiles).length === 0 ||
      currentData.locale === undefined;
    setIsImportButtonDisabled(invalid);
  };

  const handleCancelOverride = () => {
    tempDescription.current = "";
    setShowApproveDescriptionOverride(false);
  };

  const handleApproveOverride = () => {
    data.current.description = tempDescription.current;

    descriptionRef.current!.value = tempDescription.current;

    tempDescription.current = "";
    setShowApproveDescriptionOverride(false);
  };

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog
      open={props.isOpen}
      onKeyDown={handleKeyDown}
      fullWidth={true}
      fullScreen={fullScreen}
      maxWidth="sm"
      data-testid={DATA_TEST_ID.IMPORT_MODEL_DIALOG}
    >
      <DialogTitle>Import Model</DialogTitle>
      <DialogContent>
        <Stack margin={theme.tabiyaSpacing.xs} spacing={theme.fixedSpacing(theme.tabiyaSpacing.xl)}>
          <ModelNameField notifyModelNameChanged={handleNameChange} />
          <ModelLocalSelectField locales={props.availableLocales} notifyModelLocaleChanged={handleLocaleChange} />
          <ModelDescriptionField ref={descriptionRef} notifyModelDescriptionChanged={handleDescriptionChange} />
          <Stack direction={"row"} gap={theme.tabiyaSpacing.xs}>
            <FormControlLabel
              data-testid={DATA_TEST_ID.IMPORT_ORIGINAL_ESCO_CHECKBOX_LABEL}
              control={
                <Checkbox
                  onChange={handleOriginalESCOChange}
                  data-testid={DATA_TEST_ID.IMPORT_ORIGINAL_ESCO_CHECKBOX}
                  sx={{
                    color: theme.palette.primary.main,
                    "&.Mui-checked": {
                      color: theme.palette.primary.main,
                    },
                  }}
                />
              }
              label="I'm importing a base ESCO model"
            />

            <HelpTip data-testid={DATA_TEST_ID.IMPORT_ORIGINAL_ESCO_CHECKBOX_TOOLTIP}>
              Check this if you are importing these CSVs for the very first time.
            </HelpTip>
          </Stack>
          <ImportFilesSelection
            notifySelectedFileChange={handleSelectedFileChange}
            notifyUUIDHistoryChange={handleUUIDHistoryChange}
            notifyOnLicenseChange={handleLicenseChange}
            notifyOnDescriptionChange={handleFromModelInfoDescriptionChange}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <CancelButton
          onClick={() => {
            handleClose({ name: "CANCEL" });
          }}
          data-testid={DATA_TEST_ID.CANCEL_BUTTON}
        />
        <PrimaryButton
          onClick={() => handleClose({ name: "IMPORT", importData: data.current })}
          disabled={isImportButtonDisabled}
          disableWhenOffline={true}
          data-testid={DATA_TEST_ID.IMPORT_BUTTON}
        >
          Import
        </PrimaryButton>
      </DialogActions>
      <ApproveModal
        title={"Do you want to overwrite model description?"}
        content={
          <Typography>
            You have already entered a model description. The uploaded model info.csv contains a different model
            description. Which one would you like to keep?
          </Typography>
        }
        isOpen={showApproveDescriptionOverride}
        onCancel={handleCancelOverride}
        onApprove={handleApproveOverride}
        cancelButtonText={"Keep current"}
        approveButtonText={"Overwrite"}
      />
    </Dialog>
  );
};
export default ImportModelDialog;
