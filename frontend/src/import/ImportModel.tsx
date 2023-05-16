import react, {useState} from 'react';
import {FormGroup, InputLabel} from '@mui/material';
import './import.style.css';

import ImportService from "./import.service";
import {ILocale} from "api-specifications/modelInfo";
import {ServiceError} from "../error/error";
import {writeServiceErrorToLog} from "../error/logger";

const uniqueId = "72be571e-b635-4c15-85c6-897dab60d59f"
export const DATA_TEST_ID = {
  WELCOME_PAGE_ROOT: `welcome-page-${uniqueId}`,
  VERSION_FRONT_ROOT: `version-frontend-${uniqueId}`,
  VERSION_BACKEND_ROOT: `version-backend-${uniqueId}`,
  DIALOG_ROOT: `root-${uniqueId}`,
  IMPORT_BUTTON: `import-button-${uniqueId}`,
  NAME_INPUT: `name-input-${uniqueId}`,
  DESC_INPUT: `desc-input-${uniqueId}`,
}

const ImportModal = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const importService = new ImportService("https://dev.tabiya.tech/api");
  // if no uniqueId is passed in props, generate a unique id

  const handleImportButtonClick = async () => {
    const demoLocale: ILocale = {
      name: "South Africa",
      shortCode: "ZA",
      UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a"
    };
    try {
      const modelID = await importService.createModel({
        name, description, locale: demoLocale
      });
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
        <ModelNameField value={name!} setValue={setName}/>
        <ModelDescriptionField value={description!}
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
    <InputLabel htmlFor="Name">Model Name</InputLabel>
    <input name="Name" title='ModelName' data-testid={DATA_TEST_ID.NAME_INPUT}
           type='text' placeholder="enter model name" value={value}
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
    <InputLabel htmlFor="Description">Model Description</InputLabel>
    <textarea placeholder="Enter Model Description" className='desc' name="Description"
              value={value} onChange={handleTextInputChange}
              data-testid={DATA_TEST_ID.DESC_INPUT}
    />
  </FormGroup>;
};

export default ImportModal;

interface TextInputFieldProps {
  value: string,
  setValue: react.Dispatch<react.SetStateAction<string>>
}