import react from "react";
import {FormControl, FormLabel, TextareaAutosize} from "@mui/material";
import {generateUniqueId} from "src/utils/generateUniqueId";

export const TEXT = {
  MODEL_DESC_LABEL: "Model Description",
  MODEL_DESC_PLACEHOLDER: "Enter model description"
}
const baseTestID = "110643ab-593e-47dc-b398-ecc98518660e"

export const DATA_TEST_ID = {
  MODEL_DESC_INPUT: `model-desc-input-${baseTestID}`,
  MODEL_DESC_LABEL: `model-desc-label-${baseTestID}`
}

export interface ModelDescriptionFieldProps {
  notifyModelDescriptionChanged?: (newDescription: string) => void
}

export const ModelDescriptionField = ({notifyModelDescriptionChanged}: ModelDescriptionFieldProps) => {
  const uniqueId = generateUniqueId();

  function handleTextInputChange(e: react.ChangeEvent<HTMLTextAreaElement>) {
    if (notifyModelDescriptionChanged) {
      notifyModelDescriptionChanged(e.target.value);
    }
  }

  return <FormControl sx={{width: '100%'}}>
    <FormLabel data-testid={DATA_TEST_ID.MODEL_DESC_LABEL} htmlFor={uniqueId}>{TEXT.MODEL_DESC_LABEL}</FormLabel>
    <TextareaAutosize
      data-testid={DATA_TEST_ID.MODEL_DESC_INPUT}
      placeholder={TEXT.MODEL_DESC_PLACEHOLDER}
      id={uniqueId}
      minRows={6}
      onChange={handleTextInputChange}
    />
  </FormControl>
};
export default ModelDescriptionField;