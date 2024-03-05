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
  let duration;
  let text;
  try {
    duration = getDurationBetweenDates(props.firstDate, props.secondDate ?? new Date())
    text = duration + (!props.secondDate ? " (ongoing)" : "")
  } catch (e) {
    console.error(e);
    text = "Invalid date range";
  }

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
