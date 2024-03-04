import React from "react";
import {VisualMock} from "src/_test_utilities/VisualMock";

interface DurationPropertyFieldProps {
  label: string;
  firstDate: Date;
  secondDate?: Date;
  fieldId: string;
  "data-testid"?: string;
}

const uniqueId = "11c25b71-694a-419b-84b5-e54dab9c2f66";

export const DATA_TEST_ID = {
  DURATION_FIELD: `duration-${uniqueId}`,
};

/**
 * DurationPropertyField is responsible for showing the duration between two dates
 * @param props
 * @constructor
 */

const DurationPropertyField: React.FC<DurationPropertyFieldProps> = (
  props: Readonly<DurationPropertyFieldProps>
) => {
  return <VisualMock text="DurationPropertyField" />
};

export default DurationPropertyField;
// should not be an updating clock but a static value
// 12 minutes 45 seconds (still ongoing)