import { Typography } from "@mui/material";
import React from "react";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";

export interface TextPropertyFieldProps {
  label: string;
  text: string;
  "data-testid"?: string;
  fieldId: string;
}

const uniqueId = "5abb0d55-4073-4f5b-8432-ee8c96aa4df2";
export const DATA_TEST_ID = {
  TEXT_PROPERTY_FIELD_TEXT: `text-property-field-text-${uniqueId}`,
};

const TextPropertyField = (props: Readonly<TextPropertyFieldProps>) => {
  return (
    <PropertyFieldLayout title={props.label} data-testid={props["data-testid"]} fieldId={props.fieldId}>
      <Typography
        variant="body1"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        data-testid={DATA_TEST_ID.TEXT_PROPERTY_FIELD_TEXT}
        role="text"
      >
        {props.text}
      </Typography>
    </PropertyFieldLayout>
  );
};

export default TextPropertyField;
