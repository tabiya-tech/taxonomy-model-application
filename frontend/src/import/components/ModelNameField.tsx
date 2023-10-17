import react from "react";
import { FormControl, FormLabel, Input, Stack, useTheme } from "@mui/material";
import { generateUniqueId } from "src/utils/generateUniqueId";
import debounce from "lodash.debounce";
import { DEBOUNCE_INTERVAL } from "./debouncing";

export const TEXT = {
  MODEL_NAME_LABEL: "Model Name",
  MODEL_NAME_PLACEHOLDER: "Enter model name",
};
const baseTestID = "d2bc4d5d-7760-450d-bac6-a8857affeb89";

export const DATA_TEST_ID = {
  MODEL_NAME_FIELD: `model-name-field-${baseTestID}`,
  MODEL_NAME_INPUT: `model-name-input-${baseTestID}`,
  MODEL_NAME_LABEL: `model-name-label-${baseTestID}`,
};

export interface ModelNameFieldProps {
  notifyModelNameChanged?: (newName: string) => any;
}

export const ModelNameField = (props: Readonly<ModelNameFieldProps>) => {
  const uniqueId = "gtmtko1";

  const throttledHandleTextInputChange = debounce(handleTextInputChange, DEBOUNCE_INTERVAL);

  function handleTextInputChange(e: react.ChangeEvent<HTMLTextAreaElement>) {
    if (props.notifyModelNameChanged) {
      props.notifyModelNameChanged(e.target.value);
    }
  }

  const theme = useTheme();
  return (
    <FormControl sx={{ width: "100%" }} data-testid={DATA_TEST_ID.MODEL_NAME_FIELD}>
      <Stack spacing={theme.tabiyaSpacing.xs}>
        <FormLabel required data-testid={DATA_TEST_ID.MODEL_NAME_LABEL} htmlFor={uniqueId}>
          {TEXT.MODEL_NAME_LABEL}
        </FormLabel>
        <Input
          placeholder={TEXT.MODEL_NAME_PLACEHOLDER}
          sx={{ width: "100%" }}
          id={uniqueId}
          inputProps={{ "data-testid": DATA_TEST_ID.MODEL_NAME_INPUT }}
          onChange={throttledHandleTextInputChange}
        />
      </Stack>
    </FormControl>
  );
};
export default ModelNameField;
