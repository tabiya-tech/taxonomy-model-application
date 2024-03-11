//mute chatty console
import "src/_test_utilities/consoleMock";

import React from "react";
import { v4 as uuid } from "uuid";
import "@testing-library/jest-dom";
import HelpTip from "src/theme/HelpTip/HelpTip";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { render, screen } from "src/_test_utilities/test-utils";
import ImportStatusPropertyField, { HELP_TIP_TEXT } from "./ImportStatusPropertyField";
import { DATA_TEST_ID as ICON_DATA_TEST_ID } from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import { ImportProcessStateEnums } from "api-specifications/importProcessState/enums";

import ImportProcessState = ModelInfoTypes.ImportProcessState;

jest.mock("src/theme/HelpTip/HelpTip", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return <></>;
  }),
}));

const cases = [
  {
    name: "Pending",
    state: {
      status: ImportProcessStateEnums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_PENDING,
    checkedMessages: ["Pending"],
    helpTipMessages: [HELP_TIP_TEXT.PENDING],
  },
  {
    name: "Running",
    state: {
      status: ImportProcessStateEnums.Status.RUNNING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_RUNNING,
    checkedMessages: ["Running"],
    helpTipMessages: [HELP_TIP_TEXT.RUNNING],
  },
  {
    name: "Completed",
    state: {
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_SUCCESS,
    checkedMessages: ["Completed successfully"],
    helpTipMessages: [HELP_TIP_TEXT.SUCCESS],
  },
  {
    name: "Completed With Critical Errors",
    state: {
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: true,
        parsingErrors: false,
        parsingWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "critical errors"],
    helpTipMessages: [HELP_TIP_TEXT.ERROR],
  },
  {
    name: "Completed With Parsing Errors",
    state: {
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingErrors: true,
        parsingWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing errors"],
    helpTipMessages: [HELP_TIP_TEXT.PARSING_ERROR],
  },
  {
    name: "Completed With Parsing Warnings",
    state: {
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: true,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing warnings"],
    helpTipMessages: [HELP_TIP_TEXT.PARSING_WARNING],
  },
  {
    name: "Completed With Parsing Errors and Parsing Warnings",
    state: {
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingErrors: true,
        parsingWarnings: true,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing errors", "parsing warnings"],
    helpTipMessages: [HELP_TIP_TEXT.PARSING_WARNING, HELP_TIP_TEXT.PARSING_ERROR],
  },
];

describe("ImportStatusPropertyField", () => {
  test.each(cases)(`Should Render correctly for case: $name`, (testCase) => {
    // GIVEN the ImportStatusPropertyField component is rendered with a specific import state.
    const importProcessState: ImportProcessState = {
      id: uuid(),
      status: testCase.state?.status!,
      result: testCase.state?.result!,
    };
    // AND a data-testid
    const givenDataTestId = "import-status-details";
    // AND a unique fieldId
    const id = "field-id";

    // WHEN the component mounts
    render(
      <ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} data-testid={givenDataTestId} />
    );

    // THEN the component should be displayed
    const propertyFieldLayoutComponent = screen.getByTestId(givenDataTestId);
    expect(propertyFieldLayoutComponent).toBeInTheDocument();

    // THEN it should display the correct status icon if not unknown
    const statusIcon = screen.getByTestId(testCase.icon);
    expect(statusIcon).toBeInTheDocument();

    // AND the message should be correct
    testCase.checkedMessages.forEach((message) => {
      expect(screen.getAllByText(message).length).toBeGreaterThanOrEqual(1);
    });

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND Help Tip Messages should be present
    testCase.helpTipMessages.forEach((message) => {
      expect(HelpTip).toHaveBeenCalledWith(
        {
          "data-testid": expect.any(String),
          children: message,
        },
        {}
      );
    });

    // AND it should match the snapshot
    expect(propertyFieldLayoutComponent).toMatchSnapshot();
  });

  test("Should return Unknown Status on Invalid status", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with a status case that can't exist
    const importProcessState: ImportProcessState = {
      id: uuid(),
      // @ts-ignore
      status: "INVALID_STATUS",
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
    };
    const givenInvalidStatus = "INVALID_STATUS";
    // @ts-ignore
    importProcessState.status = givenInvalidStatus;
    // AND a data-testid
    const givenDataTestId = "import-status-details";
    // AND a unique fieldId
    const id = "field-id";

    // WHEN the component mounts
    render(
      <ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} data-testid={givenDataTestId} />
    );

    // THEN it should return unknown status
    expect(screen.getByText("Completed with unexpected status " + givenInvalidStatus)).toBeInTheDocument();
  });
});
