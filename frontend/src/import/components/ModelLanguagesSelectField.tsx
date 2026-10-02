import React from "react";
import {
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  useTheme,
} from "@mui/material";
import LanguageAPISpecs from "api-specifications/language";

/**
 * Where the selected languages come from, used to tell the user how the selection was pre-filled
 */
export enum LanguagesSource {
  /** No model info file is selected, the selection defaults to the fall back language */
  DEFAULT = "DEFAULT",
  /** The selection was pre-filled from the LANGUAGES column of the model info file */
  MODEL_INFO = "MODEL_INFO",
  /** The model info file has no LANGUAGES column, the selection defaults to the fall back language */
  LEGACY_MODEL_INFO = "LEGACY_MODEL_INFO",
}

const FALLBACK_LANGUAGE_NAME = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.name;

export const TEXT = {
  MODEL_LANGUAGES_SELECT_LABEL: "Select Model Languages",
  SOURCE: {
    [LanguagesSource.DEFAULT]: `Languages of the CSV data, defaults to ${FALLBACK_LANGUAGE_NAME}.`,
    [LanguagesSource.MODEL_INFO]: "Languages of the CSV data, taken from the model info file.",
    [LanguagesSource.LEGACY_MODEL_INFO]: `Languages of the CSV data, defaults to ${FALLBACK_LANGUAGE_NAME} as the model info file lists none.`,
  },
  NO_LANGUAGE_SELECTED_ERROR: "Select at least one language.",
};

const uniqueId = "0b6f7a52-3c1e-4d59-9a8b-4f1e2d7c6a90";

export const DATA_TEST_ID = {
  MODEL_LANGUAGES_SELECT_FIELD: `model-languages-select-field-${uniqueId}`,
  MODEL_LANGUAGES_LABEL: `model-languages-label-${uniqueId}`,
  MODEL_LANGUAGES_INPUT: `model-languages-input-${uniqueId}`,
  MODEL_LANGUAGES_DROPDOWN: `model-languages-dropdown-${uniqueId}`,
  MODEL_LANGUAGES_ITEM: `model-languages-item-${uniqueId}`,
  MODEL_LANGUAGES_HELPER_TEXT: `model-languages-helper-text-${uniqueId}`,
};

export interface ModelLanguagesSelectFieldProps {
  /** The short codes of the selected languages */
  selectedLanguages: string[];
  /** Where the selected languages come from */
  source: LanguagesSource;
  notifyModelLanguagesChanged?: (shortCodes: string[]) => void;
}

const getLanguageName = (shortCode: string): string =>
  LanguageAPISpecs.Helpers.getLanguageByShortCode(shortCode)?.name ?? shortCode;

/**
 * Lets the user select the languages the model carries data in, among the languages of the registry
 */
const ModelLanguagesSelectField = (props: Readonly<ModelLanguagesSelectFieldProps>) => {
  const theme = useTheme();
  const hasNoLanguageSelected = props.selectedLanguages.length === 0;

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    // on autofill the value is a comma separated string
    const shortCodes = typeof value === "string" ? value.split(",") : value;
    props.notifyModelLanguagesChanged?.(shortCodes);
  };

  return (
    <FormControl
      sx={{ width: "100%" }}
      error={hasNoLanguageSelected}
      data-testid={DATA_TEST_ID.MODEL_LANGUAGES_SELECT_FIELD}
    >
      <Stack spacing={theme.tabiyaSpacing.xs}>
        <FormLabel required id={uniqueId} data-testid={DATA_TEST_ID.MODEL_LANGUAGES_LABEL}>
          {TEXT.MODEL_LANGUAGES_SELECT_LABEL}
        </FormLabel>
        <Select
          multiple
          labelId={uniqueId}
          data-testid={DATA_TEST_ID.MODEL_LANGUAGES_DROPDOWN}
          sx={{ width: "100%" }}
          variant={"standard"}
          value={props.selectedLanguages}
          onChange={handleChange}
          renderValue={(selected) => selected.map(getLanguageName).join(", ")}
          inputProps={{
            "data-testid": DATA_TEST_ID.MODEL_LANGUAGES_INPUT,
          }}
        >
          {LanguageAPISpecs.Constants.Languages.map((language) => (
            <MenuItem
              data-testid={DATA_TEST_ID.MODEL_LANGUAGES_ITEM}
              key={language.shortCode}
              value={language.shortCode}
            >
              <Checkbox checked={props.selectedLanguages.includes(language.shortCode)} />
              <ListItemText primary={`${language.name} (${language.shortCode})`} />
            </MenuItem>
          ))}
        </Select>
        <FormHelperText data-testid={DATA_TEST_ID.MODEL_LANGUAGES_HELPER_TEXT}>
          {hasNoLanguageSelected ? TEXT.NO_LANGUAGE_SELECTED_ERROR : TEXT.SOURCE[props.source]}
        </FormHelperText>
      </Stack>
    </FormControl>
  );
};

export default ModelLanguagesSelectField;
