import react from "react";
import {FormControl, FormLabel, Input, Stack, TextField, Typography, useTheme} from "@mui/material";
import {generateUniqueId} from "src/utils/generateUniqueId";
import {useStyles} from "src/theme/global.style";

export const TEXT = {
  MODEL_NAME_LABEL: "Model Name",
  MODEL_NAME_PLACEHOLDER: "Enter model name"
}
const baseTestID = "d2bc4d5d-7760-450d-bac6-a8857affeb89"

export const DATA_TEST_ID = {
  MODEL_NAME_FIELD: `model-name-field-${baseTestID}`,
  MODEL_NAME_INPUT: `model-name-input-${baseTestID}`,
  MODEL_NAME_LABEL: `model-name-label-${baseTestID}`
}

export interface ModelNameFieldProps {
  notifyModelNameChanged?: (newName: string) => void
}

export const ModelNameField = (props: ModelNameFieldProps) => {
  const uniqueId = generateUniqueId();

  function handleTextInputChange(e: react.ChangeEvent<HTMLTextAreaElement>) {
    if (props.notifyModelNameChanged) {
      props.notifyModelNameChanged(e.target.value);
    }
  }
  const classes = useStyles();
  return <FormControl sx={{width: '100%'}} data-testid={DATA_TEST_ID.MODEL_NAME_FIELD}>
    <Stack className={classes.fieldStack} spacing={0.5}>
      <FormLabel required data-testid={DATA_TEST_ID.MODEL_NAME_LABEL}
                 htmlFor={uniqueId}>{TEXT.MODEL_NAME_LABEL}</FormLabel>
      <Input
        placeholder={TEXT.MODEL_NAME_PLACEHOLDER}
        sx={{width: '100%', color: 'red'}}
        id={uniqueId}
        inputProps={{"data-testid": DATA_TEST_ID.MODEL_NAME_INPUT}}
        onChange={handleTextInputChange}
      />
      {true && <Typography variant={"caption"} sx={{ "color": "red" }}>Input must be at least 5 characters long</Typography>}
    </Stack>
  </FormControl>
};
export default ModelNameField;