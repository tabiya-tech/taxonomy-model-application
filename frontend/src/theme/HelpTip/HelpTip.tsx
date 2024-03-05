import React from "react";
import {VisualMock} from "src/_test_utilities/VisualMock";

export interface HelpTipProps {
  children?: React.ReactNode;
  "data-testid"?: string;
}

const uniqueId = "4b757f12-fb67-4a59-94b1-b8a2498a7a49";

export const DATA_TEST_ID = {
  HELP_ICON: `help-icon-${uniqueId}`,
};

/**
 * HelpTip is responsible for showing a tooltip that shows a helpful dialog with some react component
 * @param props
 * @constructor
 */

const HelpTip: React.FC<HelpTipProps> = (
  props: Readonly<HelpTipProps>
) => {
  return <VisualMock text="HelpTip" />
};

export default HelpTip
