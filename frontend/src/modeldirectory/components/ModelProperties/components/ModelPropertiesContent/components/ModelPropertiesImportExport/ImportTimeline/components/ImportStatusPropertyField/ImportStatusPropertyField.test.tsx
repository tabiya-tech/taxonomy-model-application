//mute chatty console
import "src/_test_utilities/consoleMock";

import React from "react";
import { v4 as uuid } from "uuid"
import "@testing-library/jest-dom";
import { render, screen } from "src/_test_utilities/test-utils";
import * as States from "./ImportStatusPropertyField.stories";
import ImportProcessStateEnums from "api-specifications/importProcessState";
import { DATA_TEST_ID as HELP_TIP_DATA_TEST_ID } from "src/theme/HelpTip/HelpTip";
import ImportStatusPropertyField, { DATA_TEST_ID } from "./ImportStatusPropertyField";
import { DATA_TEST_ID as ICON_DATA_TEST_ID } from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import { ModelInfoTypes } from "../../../../../../../../../../modelInfo/modelInfoTypes";

import ImportProcessState = ModelInfoTypes.ImportProcessState;

describe('ImportStatusPropertyField', () => {
  let id = uuid();

  it("Should Render correctly for Pending State", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with pending import state.
    const importProcessState = States.Pending.args?.importProcessState!;

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    const statusField = screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_PENDING)

    // THEN it status field should be rendered.
    expect(statusField).toBeInTheDocument()

    // THEN it should display the Pending status icon
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be pending
    expect(message).toBeInTheDocument();
    expect(message.innerHTML).toBe("Pending")

    //AND it should not have help tip in the document
    expect(screen.queryByTestId(HELP_TIP_DATA_TEST_ID.HELP_ICON)).not.toBeInTheDocument()

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
  })

  it("Should Render correctly for Running State", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with running import state.
    const importProcessState = States.Running.args?.importProcessState!;

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should display the Running status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_RUNNING)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be running
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    expect(message.innerHTML).toBe("Running")

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
  })

  it("Should Render correctly for Completed Successfully", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed successfully import state.
    const importProcessState = States.Completed.args?.importProcessState!;

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should display the Completed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_SUCCESS)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be completed
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    expect(message.innerHTML).toBe("Completed successfully")

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Critical Errors", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with critical errors import state.
    const importProcessState = States.CompletedWithCriticalErrors.args?.importProcessState!;

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should display the Completed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_FAILED)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be completed with critical errors
    expect(screen.getByText("Completed with")).toBeInTheDocument()
    expect(screen.getByText("critical errors")).toBeInTheDocument()

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Parsing Errors", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with parsing errors import state.
    const importProcessState = States.CompletedWithParsingErrors.args?.importProcessState!;

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should display the Completed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_FAILED)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be completed with parsing errors
    expect(screen.getByText("Completed with")).toBeInTheDocument()
    expect(screen.getByText("parsing errors")).toBeInTheDocument()

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // It should have helper text.
    expect(screen.getByTestId(HELP_TIP_DATA_TEST_ID.HELP_ICON)).toBeInTheDocument()

    // AND it should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Parsing Warnings", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with parsing warnings import state.
    const importProcessState = States.CompletedWithParsingWarnings.args?.importProcessState!;

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should display the Completed status icon
    // AND the message should be completed with parsing warnings

    expect(screen.getByText("Completed with")).toBeInTheDocument()
    expect(screen.getByText("parsing warnings")).toBeInTheDocument()

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();



    // AND it should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Parsing Errors and Parsing Warnings", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with parsing errors and parsing warnings import state.
    const importProcessState = States.CompletedWithParsingWarningsAndParsingErrors.args?.importProcessState!;

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should display the Completed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_FAILED)
    expect(statusIcon).toBeInTheDocument()

    // It should have two helper text.
    expect(screen.getAllByTestId(HELP_TIP_DATA_TEST_ID.HELP_ICON).length).toBe(2)

    // AND the message should be completed with parsing erros and warnings.
    expect(screen.getByText("parsing errors")).toBeInTheDocument()
    expect(screen.getByText("parsing warnings")).toBeInTheDocument()

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_STATUS_FIELD)).toMatchSnapshot()
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
