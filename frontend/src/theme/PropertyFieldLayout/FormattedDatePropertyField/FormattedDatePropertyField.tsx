import React from "react";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";
import { formatDate } from "src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat";

interface FormattedDatePropertyFieldProps {
  label: string;
  date: Date;
  "data-testid"?: string;
  fieldId: string;
}

const FormattedDatePropertyField = (props: Readonly<FormattedDatePropertyFieldProps>) => {
  return (
    <TextPropertyField
      label={props.label}
      text={formatDate(props.date)}
      fieldId={props.fieldId}
      data-testid={props["data-testid"]}
    />
  );
};

export default FormattedDatePropertyField;
