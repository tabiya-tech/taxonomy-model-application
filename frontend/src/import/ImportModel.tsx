import {Button, Container, FormGroup, Stack, Typography} from '@mui/material';
import ImportDirectorService from "./importDirector.service";
import {ILocale} from "api-specifications/modelInfo";
import {ServiceError} from "src/error/error";
import {writeServiceErrorToLog} from "src/error/logger";
import ImportFilesSelection from "./components/ImportFilesSelection";
import ModelNameField from "./components/ModelNameField";
import ModelDescriptionField from "./components/ModelDescriptionField";
import {ImportFileTypes} from "api-specifications/import";
import {useStyles} from "../global.style";

const uniqueId = "72be571e-b635-4c15-85c6-897dab60d59f"
export const DATA_TEST_ID = {
  WELCOME_PAGE_ROOT: `welcome-page-${uniqueId}`,
  VERSION_FRONT_ROOT: `version-frontend-${uniqueId}`,
  VERSION_BACKEND_ROOT: `version-backend-${uniqueId}`,
  DIALOG_ROOT: `root-${uniqueId}`,
  IMPORT_BUTTON: `import-button-${uniqueId}`,
  NAME_INPUT: `name-input-${uniqueId}`,
  DESC_INPUT: `desc-input-${uniqueId}`,
  FILE_SELECTOR_PARENT: `file-selector-parent-${uniqueId}`,
  FILE_SELECTOR_INPUT: `file-selector-input-${uniqueId}`,
  FILE_SELECTOR_PLACEHOLDER_LABEL: `file-selector-placeholder-label-${uniqueId}`,
  FILE_SELECTOR_FILE_POOL: `file-selector-file-pool-${uniqueId}`
}

const elementUniqueUUID = "d2bc4d5d-7760-450d-bac6-a8857affeb89"
export const HTML_ELEMENT_IDS = {
  FILE_SELECTOR_PARENT: `file-selector-parent-${elementUniqueUUID}`,
  FILE_SELECTOR_INPUT: `file-selector-input-${elementUniqueUUID}`,
  FILE_SELECTOR_FLAG_LABEL: `file-selector-flag-label-${elementUniqueUUID}`,
  FILE_SELECTOR_FILE_POOL: `file-selector-file-pool-${elementUniqueUUID}`,
  MODEL_NAME: `model-name-${elementUniqueUUID}`,
  MODEL_DESCRIPTION: `model-description-${elementUniqueUUID}`,
}

/**
 * "ESCO Occupations",
 *       "ESCO Skill Hierarchy","ESCO Skill Groups",
 *       "ESCO Skill","ISCO Groups",
 *       "Local Occupations","Localized Occupations",
 *       "Model Info","Occupations  Hierarchy"
 * */

interface ImportData {
  name: string,
  description: string,
  locale: ILocale,
  selectedFiles: { [key in ImportFileTypes]?: File }
}

const ImportModel = () => {

  const data: ImportData = {
    name: "",
    description: "",
    locale: {
      name: "South Africa",
      shortCode: "ZA",
      UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a"
    },
    selectedFiles: {}
  }

  const importDirectorService = new ImportDirectorService("https://dev.tabiya.tech/api");
  // if no uniqueId is passed in props, generate a unique id

  const handleNameChange = (newName: string) => {
    data.name = newName;
  }
  const handleDescriptionChange = (newDescription: string) => {
    data.description = newDescription;
  }
  const handleSelectedFileChange = (fileType: ImportFileTypes, file: File | null) => {
    if (file === null) {
      delete data.selectedFiles[fileType];
    } else {
      data.selectedFiles[fileType] = file;
    }
  }

  const handleImportButtonClick = async () => {
    try {
      const files = Object.entries(data.selectedFiles).map(([fileType, file]) => {
        return {
          fileType: fileType as ImportFileTypes,
          file: file
        }
      });
      const modelID = await importDirectorService.directImport(
        data.name, data.description, data.locale, files
      );

      console.log("Created model: " + modelID);
    } catch (e) {
      if (e instanceof ServiceError) {
        writeServiceErrorToLog(e, console.error);
      } else {
        console.error(e);
      }
    }
  };
  const classes = useStyles();
  return <Container maxWidth="lg" data-testid={DATA_TEST_ID.DIALOG_ROOT}>
    <Stack className={classes.customStack} spacing={5}>
      <Typography className="title">Import Model</Typography>
      <ModelNameField notifyModelNameChanged={handleNameChange}/>
      <ModelDescriptionField notifyModelDescriptionChanged={handleDescriptionChange}/>
      <ImportFilesSelection notifySelectedFileChange={handleSelectedFileChange}/>
      <FormGroup sx={{direction: "row", justifyContent: 'flex-end', alignItems: 'flex-start', width: '100%'}}>
        <Button variant="outlined" sx={{marginLeft: 'auto'}} onClick={handleImportButtonClick}
                data-testid={DATA_TEST_ID.IMPORT_BUTTON}>Import</Button>
        {/*<button>Cancel</button>*/}
      </FormGroup>
    </Stack>
  </Container>
};
export default ImportModel;
