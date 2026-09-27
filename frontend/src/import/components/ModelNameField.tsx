import react, { useMemo, useRef } from "react";
import { FormControl, FormLabel, Input, Stack, useTheme } from "@mui/material";
import debounce from "lodash.debounce";
import { DEBOUNCE_INTERVAL } from "./debouncing";

export const TEXT = {
  MODEL_NAME_LABEL: "Model Name",
  MODEL_NAME_PLACEHOLDER: "Enter model name",
};

const uniqueId = "d2bc4d5d-7760-450d-bac6-a8857affeb89";

export const DATA_TEST_ID = {
  MODEL_NAME_FIELD: `model-name-field-${uniqueId}`,
  MODEL_NAME_INPUT: `model-name-input-${uniqueId}`,
  MODEL_NAME_LABEL: `model-name-label-${uniqueId}`,
};

export interface ModelNameFieldProps {
  notifyModelNameChanged?: (newName: string) => any;
}

export const ModelNameField = (props: Readonly<ModelNameFieldProps>) => {
  const theme = useTheme();

  function handleTextInputChange(e: react.ChangeEvent<HTMLTextAreaElement>) {
    if (props.notifyModelNameChanged) {
      props.notifyModelNameChanged(e.target.value);
    }
  }

  // Keep a ref to the latest handler so the debounced function (created once)
  // always calls the current version without recreating itself.
  const handleTextInputChangeRef = useRef(handleTextInputChange);
  handleTextInputChangeRef.current = handleTextInputChange;

  const throttledHandleTextInputChange = useMemo(
    () =>
      debounce((e: react.ChangeEvent<HTMLTextAreaElement>) => handleTextInputChangeRef.current(e), DEBOUNCE_INTERVAL),
    []
  );

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
