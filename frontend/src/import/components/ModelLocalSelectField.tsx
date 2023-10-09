import { FormControl, Stack, MenuItem, Select, FormLabel, SelectChangeEvent } from "@mui/material";
import { useStyles } from "src/theme/global.style";
import React, { useEffect } from "react";
import Locale from "api-specifications/locale";
import { generateUniqueId } from "src/utils/generateUniqueId";
import { isUnspecified } from "src/utils/isUnspecified";

export const TEXT = {
  MODEL_LOCALE_SELECT_LABEL: "Select Model Locale",
};
const baseTestID = "110643ab-593e-47dc-b398-ecc98518660e";

export const DATA_TEST_ID = {
  MODEL_LOCALE_SELECT_FIELD: `model-locale-select-field-${baseTestID}`,
  MODEL_LOCALE_LABEL: `model-locale-label-${baseTestID}`,
  MODEL_LOCALE_INPUT: `model-locale-input-${baseTestID}`,
  MODEL_LOCALE_DROPDOWN: `model-locale-input-dropdown-${baseTestID}`,
  MODEL_LOCALE_ITEM: `model-locale-item-${baseTestID}`,
};

export interface ModelLocaleSelectProps {
  locales: Locale.Types.Payload[];
  notifyModelLocaleChanged?: (locale: Locale.Types.Payload) => any;
}

const ModelLocalSelectField = (props: ModelLocaleSelectProps) => {
  if (props.locales.length === 0 || props.locales.find((locale) => isUnspecified(locale.UUID))) {
    console.error("Locales should have at least one item");
  }
  const uniqueId = generateUniqueId();

  const [selectedLocaleUUID, setSelectedLocaleUUID] = React.useState<string>(props.locales[0].UUID);

  const handleChange = (event: SelectChangeEvent) => {
    const UUID = event.target.value;
    setSelectedLocaleUUID(UUID);
    callNotifyModelLocaleChanged(UUID);
  };

  useEffect(() => {
    // notify the about the initial selected value, only once,
    // when the component is rendered for the first time
    callNotifyModelLocaleChanged(selectedLocaleUUID);
  });

  function callNotifyModelLocaleChanged(UUID: string) {
    if (props.notifyModelLocaleChanged) {
      const selected = props.locales.find((locale) => locale.UUID === UUID);
      if (selected) {
        props.notifyModelLocaleChanged(selected);
      }
    }
  }

  const classes = useStyles();
  return (
    <FormControl sx={{ width: "100%" }} data-testid={DATA_TEST_ID.MODEL_LOCALE_SELECT_FIELD}>
      <Stack className={classes.fieldStack} spacing={0.5}>
        <FormLabel required id={uniqueId} data-testid={DATA_TEST_ID.MODEL_LOCALE_LABEL}>
          {TEXT.MODEL_LOCALE_SELECT_LABEL}
        </FormLabel>
        <Select
          labelId={uniqueId}
          data-testid={DATA_TEST_ID.MODEL_LOCALE_DROPDOWN}
          sx={{ width: "100%" }}
          variant={"standard"}
          value={selectedLocaleUUID}
          onChange={handleChange}
          inputProps={{
            "data-testid": DATA_TEST_ID.MODEL_LOCALE_INPUT,
          }}
        >
          {props.locales?.map((locale) => (
            <MenuItem data-testid={DATA_TEST_ID.MODEL_LOCALE_ITEM} key={locale.UUID} value={locale.UUID}>
              {locale.name} &nbsp; ({locale.shortCode})
            </MenuItem>
          ))}
        </Select>
      </Stack>
    </FormControl>
  );
};

export default ModelLocalSelectField;
