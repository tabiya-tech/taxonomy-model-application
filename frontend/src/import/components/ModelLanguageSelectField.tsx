import React, { useEffect } from "react";
import { FormControl, FormLabel, MenuItem, Stack, Select, useTheme, SelectChangeEvent } from "@mui/material";

export enum languageEnum {
  ENGLISH = "English",
  FRENCH = "French",
}

export const TEXT = {
  MODEL_LANGUAGE_SELECT_LABEL: "Select Model Language",
};

const uniqueId = "25e03041-603b-47ca-a0b3-a53ac60ebd0a";

export const DATA_TEST_ID = {
  MODEL_LANGUAGE_SELECT_FIELD: `model-language-select-field-${uniqueId}`,
  MODEL_LANGUAGE_LABEL: `model-language-label-${uniqueId}`,
  MODEL_LANGUAGE_DROPDOWN: `model-language-dropdown-${uniqueId}`,
  MODEL_LANGUAGE_INPUT: `model-language-input-${uniqueId}`,
  MODEL_LANGUAGE_ITEM: `model-language-item-${uniqueId}`,
};

export interface ModelLanguageSelectFieldProps {
  languages: languageEnum[];
  notifyModelLanguageChanged: (language: languageEnum) => any;
}

const ModelLanguageSelectField = (props: Readonly<ModelLanguageSelectFieldProps>) => {
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>(props.languages[0]);

  const handleChange = (event: SelectChangeEvent) => {
    const language = event.target.value;
    setSelectedLanguage(language);
    callNotifyModelLanguageChanged(language);
  };

  useEffect(() => {
    // notify the about the initial selected value, only once,
    // when the component is rendered for the first time
    callNotifyModelLanguageChanged(selectedLanguage);
  });

  function callNotifyModelLanguageChanged(language: string) {
    if (props.notifyModelLanguageChanged) {
      const selected = Object.values(languageEnum).includes(language as languageEnum);
      if (selected) {
        props.notifyModelLanguageChanged(language as languageEnum);
      }
    }
  }

  const theme = useTheme();
  return (
    <FormControl sx={{ width: "100%" }} data-testid={DATA_TEST_ID.MODEL_LANGUAGE_SELECT_FIELD}>
      <Stack spacing={theme.tabiyaSpacing.xs}>
        <FormLabel required id={uniqueId} data-testid={DATA_TEST_ID.MODEL_LANGUAGE_LABEL}>
          {TEXT.MODEL_LANGUAGE_SELECT_LABEL}
        </FormLabel>
        <Select
          labelId={uniqueId}
          sx={{ width: "100%" }}
          variant={"standard"}
          value={selectedLanguage}
          data-testid={DATA_TEST_ID.MODEL_LANGUAGE_DROPDOWN}
          onChange={handleChange}
          inputProps={{
            "data-testid": DATA_TEST_ID.MODEL_LANGUAGE_INPUT,
          }}
        >
          {props.languages?.map((language) => (
            <MenuItem key={language} value={language} data-testid={DATA_TEST_ID.MODEL_LANGUAGE_ITEM}>
              {language}
            </MenuItem>
          ))}
        </Select>
      </Stack>
    </FormControl>
  );
};

export default ModelLanguageSelectField;
