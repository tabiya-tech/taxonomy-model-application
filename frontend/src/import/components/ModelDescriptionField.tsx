import react from "react";
import { FormControl, FormLabel, Input, Stack } from "@mui/material";
import { generateUniqueId } from "src/utils/generateUniqueId";
import { useStyles } from "src/theme/global.style";
import debounce from "lodash.debounce";
import { DEBOUNCE_INTERVAL } from "./debouncing";

export const TEXT = {
  MODEL_DESC_LABEL: "Model Description",
  MODEL_DESC_PLACEHOLDER: "Enter model description",
};
const baseTestID = "110643ab-593e-47dc-b398-ecc98518660e";

export const DATA_TEST_ID = {
  MODEL_DESCRIPTION_FIELD: `model-desc-field-${baseTestID}`,
  MODEL_DESC_INPUT: `model-desc-input-${baseTestID}`,
  MODEL_DESC_LABEL: `model-desc-label-${baseTestID}`,
};

export interface ModelDescriptionFieldProps {
  notifyModelDescriptionChanged?: (newDescription: string) => void;
}

export const ModelDescriptionField = (props: ModelDescriptionFieldProps) => {
  const uniqueId = generateUniqueId();

  const debounceHandleTextInputChange = debounce(handleTextInputChange, DEBOUNCE_INTERVAL);

  function handleTextInputChange(e: react.ChangeEvent<HTMLTextAreaElement>) {
    if (props.notifyModelDescriptionChanged) {
      props.notifyModelDescriptionChanged(e.target.value);
    }
  }

  const classes = useStyles();
  return (
    <FormControl sx={{ width: "100%" }} data-testid={DATA_TEST_ID.MODEL_DESCRIPTION_FIELD}>
      <Stack className={classes.fieldStack} spacing={0.5}>
        <FormLabel data-testid={DATA_TEST_ID.MODEL_DESC_LABEL} htmlFor={uniqueId}>
          {TEXT.MODEL_DESC_LABEL}
        </FormLabel>
        <Input
          multiline
          rows={10}
          inputProps={{ "data-testid": DATA_TEST_ID.MODEL_DESC_INPUT }}
          placeholder={TEXT.MODEL_DESC_PLACEHOLDER}
          id={uniqueId}
          style={{ maxWidth: "100%", minWidth: "100%", maxHeight: "20rem", minHeight: "6rem" }}
          onChange={debounceHandleTextInputChange}
        />
      </Stack>
    </FormControl>
  );
};
export default ModelDescriptionField;
