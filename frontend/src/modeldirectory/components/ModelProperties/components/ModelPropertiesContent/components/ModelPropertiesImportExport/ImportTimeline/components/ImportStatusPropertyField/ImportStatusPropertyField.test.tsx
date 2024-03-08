//mute chatty console
import "src/_test_utilities/consoleMock";

import React from "react";
import { v4 as uuid } from "uuid"
import "@testing-library/jest-dom";
import HelpTip from "src/theme/HelpTip/HelpTip";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { render, screen } from "src/_test_utilities/test-utils";
import * as States from "./ImportStatusPropertyField.stories";
import ImportProcessStateEnums from "api-specifications/importProcessState";
import ImportStatusPropertyField, {DATA_TEST_ID, HELP_TIP_TEXT} from "./ImportStatusPropertyField";
import { DATA_TEST_ID as ICON_DATA_TEST_ID } from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";

import ImportProcessState = ModelInfoTypes.ImportProcessState;

const cases = [
  {
    name: "Pending",
    state: States.Pending.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_PENDING,
    checkedMessages: ["Pending..."],
    helpTipMessages: [HELP_TIP_TEXT.PENDING]
  },
  {
    name: "Running",
    state: States.Running.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_RUNNING,
    checkedMessages: ["Running..."],
    helpTipMessages: [HELP_TIP_TEXT.RUNNING]
  },
  {
    name: "Completed",
    state: States.Completed.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_SUCCESS,
    checkedMessages: ["Completed successfully"],
    helpTipMessages: [HELP_TIP_TEXT.SUCCESS]
  },
  {
    name: "Completed With Critical Errors",
    state: States.CompletedWithCriticalErrors.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "critical errors"],
    helpTipMessages: [HELP_TIP_TEXT.ERROR]
  },
  {
    name: "Completed With Parsing Errors",
    state: States.CompletedWithParsingErrors.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing errors"],
    helpTipMessages: [HELP_TIP_TEXT.PARSING_ERROR]
  },
  {
    name: "Completed With Parsing Warnings",
    state: States.CompletedWithParsingWarnings.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing warnings"],
    helpTipMessages: [HELP_TIP_TEXT.PARSING_WARNING]
  },
  {
    name: "Completed With Parsing Errors and Parsing Warnings",
    state: States.CompletedWithParsingWarningsAndParsingErrors.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing errors", "parsing warnings"],
    helpTipMessages: [HELP_TIP_TEXT.PARSING_WARNING, HELP_TIP_TEXT.PARSING_ERROR]
  },
]

jest.mock("src/theme/HelpTip/HelpTip", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return <></>;
  }),
}));

describe('ImportStatusPropertyField', () => {
  let id = uuid();

  test.each(cases)(`Should Render correctly for $name`, (testCase) => {
      // GIVEN the ImportStatusPropertyField component is rendered with a specific import state.
      const importProcessState: ImportProcessState = {
        id: uuid(),
        status: testCase.state?.status!,
        result: testCase.state?.result!
      };

      // WHEN the component mounts
      render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

      // THEN it should display the correct status icon if not unknown
      const statusIcon = screen.getByTestId(testCase.icon)
      expect(statusIcon).toBeInTheDocument()

      // AND the message should be correct
      testCase.checkedMessages.forEach((message) => {
        expect(screen.getAllByText(message).length).toBeGreaterThanOrEqual(1)
      })

      // AND no errors or warnings should have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND Help Tip Messages should be present
      testCase.helpTipMessages.forEach((message) => {
        expect(HelpTip).toHaveBeenCalledWith({
          "data-testid": expect.any(String),
          children: message
        }, {})
      })

      // AND it should match the snapshot
      expect(screen.getByTestId(DATA_TEST_ID.PROCCESS_STATUS_FIELD)).toMatchSnapshot()
    })

  test("Should return Unknown Status on Invalid case", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with a case that won't exist
    const importProcessState: ImportProcessState = {
      id: uuid(),
      status: ImportProcessStateEnums.Enums.Status.COMPLETED,
      result: {
        errored: true,
        parsingErrors: true,
        parsingWarnings: true
      }
    };

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should return unknown status
    expect(screen.getByText("Completed with unexpected results")).toBeInTheDocument()
  })
})
