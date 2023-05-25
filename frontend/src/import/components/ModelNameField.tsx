import react from "react";
import {FormControl, FormLabel, Input} from "@mui/material";
import {generateUniqueId} from "src/utils/generateUniqueId";

export const TEXT = {
  MODEL_NAME_LABEL: "Model Name",
  MODEL_NAME_PLACEHOLDER: "Enter model name"
}
const baseTestID = "d2bc4d5d-7760-450d-bac6-a8857affeb89"

export const DATA_TEST_ID = {
  MODEL_NAME_INPUT: `model-name-input-${baseTestID}`,
  MODEL_NAME_LABEL: `model-name-label-${baseTestID}`
}

export interface ModelNameFieldProps {
  notifyModelNameChanged?: (newName: string) => void
}

export const ModelNameField = ({notifyModelNameChanged}: ModelNameFieldProps) => {
  const uniqueId = generateUniqueId();

  function handleTextInputChange(e: react.ChangeEvent<HTMLTextAreaElement>) {
    if (notifyModelNameChanged) {
      notifyModelNameChanged(e.target.value);
    }
  }

  return <FormControl sx={{width: '100%'}}>
    <FormLabel data-testid={DATA_TEST_ID.MODEL_NAME_LABEL} htmlFor={uniqueId}>{TEXT.MODEL_NAME_LABEL}</FormLabel>
    <Input
      placeholder={TEXT.MODEL_NAME_PLACEHOLDER}
      sx={{width: '100%'}}
      id={uniqueId}
      inputProps={{"data-testid": DATA_TEST_ID.MODEL_NAME_INPUT}}
      onChange={handleTextInputChange}
    />
  </FormControl>
};
export default ModelNameField;