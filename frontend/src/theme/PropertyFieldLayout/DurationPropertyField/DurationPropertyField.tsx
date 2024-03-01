import React from "react";
import TextPropertyField from "src/theme/PropertyFieldLayout/TextPropertyField/TextPropertyField";
import { getDurationBetweenDates } from "./getDurationBetweenDates";

interface DurationPropertyFieldProps {
  label: string;
  firstDate: Date;
  secondDate?: Date; // Leave out to use the current date and indicate that the duration is ongoing
  fieldId: string;
  "data-testid"?: string;
}

const DurationPropertyField = (props: DurationPropertyFieldProps) => {
  const text = getDurationBetweenDates(props.firstDate, props.secondDate || new Date()) + (!props.secondDate ? " (ongoing)" : "");

  return (
    <TextPropertyField
      label={props.label}
      text={text}
      fieldId={props.fieldId}
      data-testid={props["data-testid"]}
    />
  );
};

export default DurationPropertyField;
