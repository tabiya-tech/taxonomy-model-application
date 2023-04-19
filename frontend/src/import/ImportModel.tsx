import react, {Dispatch, useState} from 'react';
import {FormGroup, FormLabel} from '@mui/material';
import './ImportModel.style.css';

import ImportDirectorService from "./importDirector.service";
import {ILocale} from "api-specifications/modelInfo";
import {ServiceError} from "src/error/error";
import {writeServiceErrorToLog} from "src/error/logger";

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
  FILE_SELECTOR_FLAG_LABEL: `file-selector-flag-label-${uniqueId}`,
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

const ImportModel = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const importDirectorService = new ImportDirectorService("https://dev.tabiya.tech/api");
  // if no uniqueId is passed in props, generate a unique id

  const handleImportButtonClick = async () => {
    const demoLocale: ILocale = {
      name: "South Africa",
      shortCode: "ZA",
      UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a"
    };
    try {
      const modelID = await importDirectorService.directImport(
        name, description, demoLocale, files
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

  return <div className="Import-container">
    <div className='Import-modal' data-testid={DATA_TEST_ID.DIALOG_ROOT}>
      <div className='header'>
        <p className="title">Import Model</p>
      </div>
      <div className='form'>
        <ModelFilesLoader files={files} setFiles={setFiles}/>
        <ModelNameField value={name} setValue={setName}/>
        <ModelDescriptionField value={description}
                               setValue={setDescription}/>
        <FormGroup className='action-group'>
          <button onClick={handleImportButtonClick} data-testid={DATA_TEST_ID.IMPORT_BUTTON}>Import</button>
          {/*<button>Cancel</button>*/}
        </FormGroup>
      </div>
    </div>
  </div>;
};

const ModelNameField = ({value, setValue}: TextInputFieldProps) => {
  //handles text and select input change only
  function handleTextInputChange(e: react.ChangeEvent<HTMLInputElement>) {
    return setValue(e.target.value);
  }

  return <FormGroup className='text-input-group'>
    <FormLabel htmlFor={HTML_ELEMENT_IDS.MODEL_NAME}>Model Name</FormLabel>
    <input name="Name" title='ModelName' data-testid={DATA_TEST_ID.NAME_INPUT}
           type='text' placeholder="enter model name" value={value}
           id={HTML_ELEMENT_IDS.MODEL_NAME}
           onChange={handleTextInputChange}
    />
  </FormGroup>;
};

const ModelDescriptionField = ({value, setValue}: TextInputFieldProps) => {
  //handles textarea change only
  function handleTextInputChange(e: react.ChangeEvent<HTMLTextAreaElement>) {
    return setValue(e.target.value);
  }

  return <FormGroup className='text-input-group' style={{height: "auto"}}>
    <FormLabel htmlFor={HTML_ELEMENT_IDS.MODEL_DESCRIPTION}>Model Description</FormLabel>
    <textarea placeholder="Enter Model Description" className='desc' name="Description"
              value={value} onChange={handleTextInputChange}
              id={HTML_ELEMENT_IDS.MODEL_DESCRIPTION}
              data-testid={DATA_TEST_ID.DESC_INPUT}
    />
  </FormGroup>;
};

export const ModelFilesLoader = ({files, setFiles}: {
  files: File[],
  setFiles: Dispatch<React.SetStateAction<File[]>>
}) => {
  function fileLoader(e: React.ChangeEvent<HTMLInputElement>) {
    const files: FileList = e.target.files as FileList;
    if (files) {
      setFiles(Array.from(files))
    }
  }

  return <FormGroup className='choose-file' data-testid={DATA_TEST_ID.FILE_SELECTOR_PARENT}>
    <FormLabel htmlFor={HTML_ELEMENT_IDS.FILE_SELECTOR_INPUT}>Choose File</FormLabel>
    <input name='upload-file-input' id={HTML_ELEMENT_IDS.FILE_SELECTOR_INPUT}
           data-testid={DATA_TEST_ID.FILE_SELECTOR_INPUT}
           title='upload-file' type='file'
           multiple accept='.csv' onChange={(e) => fileLoader(e)}/>
    <div className='files-pool' data-testid={DATA_TEST_ID.FILE_SELECTOR_FILE_POOL}>
      {files.length === 0
        && <FormLabel htmlFor={HTML_ELEMENT_IDS.FILE_SELECTOR_INPUT}
                      data-testid={DATA_TEST_ID.FILE_SELECTOR_FLAG_LABEL}>
          choose csv files to import </FormLabel>}
      {files.map(file => <p className='file' key={file.name}>{file.name}</p>)}
    </div>
  </FormGroup>
}

export default ImportModel;

interface TextInputFieldProps {
  value: string,
  setValue: react.Dispatch<react.SetStateAction<string>>
}