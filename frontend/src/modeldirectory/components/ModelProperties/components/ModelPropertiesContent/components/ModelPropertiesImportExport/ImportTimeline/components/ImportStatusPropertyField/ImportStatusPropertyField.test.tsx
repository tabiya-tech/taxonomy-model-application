//mute chatty console
import "src/_test_utilities/consoleMock";

import React from "react";
import { v4 as uuid } from "uuid"
import "@testing-library/jest-dom";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { render, screen } from "src/_test_utilities/test-utils";
import * as States from "./ImportStatusPropertyField.stories";
import ImportProcessStateEnums from "api-specifications/importProcessState";
import ImportStatusPropertyField, { DATA_TEST_ID } from "./ImportStatusPropertyField";
import { DATA_TEST_ID as ICON_DATA_TEST_ID } from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";

import ImportProcessState = ModelInfoTypes.ImportProcessState;


const cases = [
  {
    name: "Pending",
    state: States.Pending.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_PENDING,
    checkedMessages: ["Pending"]
  },
  {
    name: "Running",
    state: States.Running.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_RUNNING,
    checkedMessages: ["Running"]
  },
  {
    name: "Completed",
    state: States.Completed.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_SUCCESS,
    checkedMessages: ["Completed successfully"]
  },
  {
    name: "Completed With Critical Errors",
    state: States.CompletedWithCriticalErrors.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "critical errors"]
  },
  {
    name: "Completed With Parsing Errors",
    state: States.CompletedWithParsingErrors.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing errors"]
  },
  {
    name: "Completed With Parsing Warnings",
    state: States.CompletedWithParsingWarnings.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing warnings"]
  },
  {
    name: "Completed With Parsing Errors and Parsing Warnings",
    state: States.CompletedWithParsingWarningsAndParsingErrors.args?.importProcessState,
    icon: ICON_DATA_TEST_ID.ICON_STATUS_FAILED,
    checkedMessages: ["Completed with", "parsing errors", "parsing warnings"]
  },
]

describe('ImportStatusPropertyField', () => {
  let id = uuid();

  cases.forEach((testCase) => {
    it(`Should Render correctly for ${testCase.name}`, () => {
      // GIVEN the ImportStatusPropertyField component is rendered with a specific import state.
      const importProcessState: ImportProcessState = {
        id: uuid(),
        status: testCase.state?.status!,
        result: testCase.state?.result!
      };

      // WHEN the component mounts
      render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

      // THEN it should display the correct status icon if not unkown
      const statusIcon = screen.getByTestId(testCase.icon)
      expect(statusIcon).toBeInTheDocument()

      // AND the message should be correct
      testCase.checkedMessages.forEach((message) => {
        expect(screen.getAllByText(message).length).toBeGreaterThanOrEqual(1)
      })

      // AND no errors or warnings should have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND it should match the snapshot
      expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
    })
  })

  it("Should return Unkown Status on Invalid case", () => {
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
    expect(screen.getByText("Unknown Status")).toBeInTheDocument()
  })
})
