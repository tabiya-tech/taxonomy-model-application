import React, { useEffect, useMemo, useState } from "react";
import { FormControl, FormLabel, Input, Stack, useTheme } from "@mui/material";
import debounce from "lodash.debounce";
import { DEBOUNCE_INTERVAL } from "./debouncing";

export const TEXT = {
  MODEL_DESC_LABEL: "Model Description",
  MODEL_DESC_PLACEHOLDER: "Enter model description",
};
const uniqueId = "110643ab-593e-47dc-b398-ecc98518660e";

export const DATA_TEST_ID = {
  MODEL_DESCRIPTION_FIELD: `model-desc-field-${uniqueId}`,
  MODEL_DESC_INPUT: `model-desc-input-${uniqueId}`,
  MODEL_DESC_LABEL: `model-desc-label-${uniqueId}`,
};

export interface ModelDescriptionFieldProps {
  modelDescription?: string;
  notifyModelDescriptionChanged?: (newDescription: string) => void;
}

export const ModelDescriptionField = ({
  modelDescription = "",
  notifyModelDescriptionChanged,
}: Readonly<ModelDescriptionFieldProps>) => {
  const [description, setDescription] = useState(modelDescription);

  const theme = useTheme();

  // Keep local state in sync with external prop
  useEffect(() => {
    setDescription(modelDescription);
  }, [modelDescription]);

  // Debounced callback to notify parent
  const debouncedNotifyChange = useMemo(
    () =>
      debounce((value: string) => {
        notifyModelDescriptionChanged?.(value);
      }, DEBOUNCE_INTERVAL),
    [notifyModelDescriptionChanged]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDescription(newValue); // Local update
    debouncedNotifyChange(newValue); // Notify parent after debounce
  };

  return (
    <FormControl sx={{ width: "100%" }} data-testid={DATA_TEST_ID.MODEL_DESCRIPTION_FIELD}>
      <Stack spacing={theme.tabiyaSpacing.xs}>
        <FormLabel data-testid={DATA_TEST_ID.MODEL_DESC_LABEL} htmlFor={uniqueId}>
          {TEXT.MODEL_DESC_LABEL}
        </FormLabel>
        <Input
          multiline
          rows={10}
          value={description}
          inputProps={{ "data-testid": DATA_TEST_ID.MODEL_DESC_INPUT }}
          placeholder={TEXT.MODEL_DESC_PLACEHOLDER}
          id={uniqueId}
          style={{ maxWidth: "100%", minWidth: "100%", maxHeight: "20rem", minHeight: "6rem" }}
          onChange={handleChange}
        />
      </Stack>
    </FormControl>
  );
};
