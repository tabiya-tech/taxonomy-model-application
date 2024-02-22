import { FormControl, Stack, MenuItem, Select, FormLabel, SelectChangeEvent, useTheme } from "@mui/material";
import React, { useEffect } from "react";
import Locale from "api-specifications/locale";
import { isUnspecified } from "src/utils/isUnspecified";

export const TEXT = {
  MODEL_LOCALE_SELECT_LABEL: "Select Model Locale",
};
const uniqueId = "dfdbbef3-ec63-44f4-9945-a757d9c81269";

export const DATA_TEST_ID = {
  MODEL_LOCALE_SELECT_FIELD: `model-locale-select-field-${uniqueId}`,
  MODEL_LOCALE_LABEL: `model-locale-label-${uniqueId}`,
  MODEL_LOCALE_INPUT: `model-locale-input-${uniqueId}`,
  MODEL_LOCALE_DROPDOWN: `model-locale-input-dropdown-${uniqueId}`,
  MODEL_LOCALE_ITEM: `model-locale-item-${uniqueId}`,
};

export interface ModelLocaleSelectProps {
  locales: Locale.Types.Payload[];
  notifyModelLocaleChanged?: (locale: Locale.Types.Payload) => any;
}

const ModelLocalSelectField = (props: Readonly<ModelLocaleSelectProps>) => {
  if (props.locales.length === 0 || props.locales.find((locale) => isUnspecified(locale.UUID))) {
    console.error("Locales should have at least one item");
  }

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

  const theme = useTheme();
  return (
    <FormControl sx={{ width: "100%" }} data-testid={DATA_TEST_ID.MODEL_LOCALE_SELECT_FIELD}>
      <Stack spacing={theme.tabiyaSpacing.xs}>
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
