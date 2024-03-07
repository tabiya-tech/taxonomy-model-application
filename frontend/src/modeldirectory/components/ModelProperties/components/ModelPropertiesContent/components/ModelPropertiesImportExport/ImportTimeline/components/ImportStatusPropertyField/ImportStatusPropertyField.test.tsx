//mute chatty console
import "src/_test_utilities/consoleMock";

import React from "react";
import { v4 as uuid } from "uuid"
import "@testing-library/jest-dom";
import { render, screen, within } from "src/_test_utilities/test-utils";
import * as States from "./ImportStatusPropertyField.stories";
import ImportProcessStateEnums from "api-specifications/importProcessState";
import ImportStatusPropertyField, {DATA_TEST_ID, MESSAGE_TEXT, HELP_TIP_TEXT} from "./ImportStatusPropertyField";
import { DATA_TEST_ID as ICON_DATA_TEST_ID } from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import HelpTip from "src/theme/HelpTip/HelpTip";


//mock the HelpTip Component
jest.mock("src/theme/HelpTip/HelpTip", () => {
  return {
    __esModule: true,
    default: jest.fn((props: any) => {
      return <span data-testid={props["data-testid"]}>{props.children}</span>
    })
  }
});

describe('ImportStatusPropertyField', () => {
  let id = uuid();

  it("Should Render correctly for Pending State", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with pending import state.
    const importProcessState = States.Pending.args?.importProcessState!;
    // AND GIVEN a dataTestId
    const dataTestId = "import-status-property-field";

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} dataTestId={dataTestId}/>);

    // THEN the status field should be rendered.
    const statusField = screen.getByTestId(dataTestId)
    expect(statusField).toBeInTheDocument()

    // THEN it should display the Pending status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_PENDING)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be shown
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    // AND the message should have the expected text
    expect(screen.getByText(MESSAGE_TEXT.PENDING)).toBeInTheDocument()
    // AND the message should have a help tip for pending
    const pendingHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_PENDING)
    expect(pendingHelpTip).toBeInTheDocument()
    // AND the help tip should be called with the correct props
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_PENDING,
      children: HELP_TIP_TEXT.PENDING
    }, {})

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    expect(statusField).toMatchSnapshot()
  })

  it("Should Render correctly for Running State", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with running import state.
    const importProcessState = States.Running.args?.importProcessState!;
    // AND GIVEN a dataTestId
    const dataTestId = "import-status-property-field";

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} dataTestId={dataTestId}/>);

    // THEN the status field should be rendered.
    const statusField = screen.getByTestId(dataTestId)
    expect(statusField).toBeInTheDocument()

    // THEN it should display the Running status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_RUNNING)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be shown
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    // AND the message should have the expected text
    expect(screen.getByText(MESSAGE_TEXT.RUNNING)).toBeInTheDocument()
    // AND the message should have a help tip for running
    const runnningHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_RUNNING)
    expect(runnningHelpTip).toBeInTheDocument()
    // AND the help tip should be called with the correct props
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_RUNNING,
      children: HELP_TIP_TEXT.RUNNING
    }, {})

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(statusField).toMatchSnapshot()
  })

  it("Should Render correctly for Completed Successfully", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed successfully import state.
    const importProcessState = States.Completed.args?.importProcessState!;
    // AND GIVEN a dataTestId
    const dataTestId = "import-status-property-field";

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} dataTestId={dataTestId}/>);

    // THEN the status field should be rendered.
    const statusField = screen.getByTestId(dataTestId)
    expect(statusField).toBeInTheDocument()

    // THEN it should display the success status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_SUCCESS)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be shown
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    // AND the message should have the expected text
    expect(screen.getByText(MESSAGE_TEXT.COMPLETED_SUCCESS)).toBeInTheDocument()
    // AND the message should have a help tip for success
    const successHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_SUCCESS)
    expect(successHelpTip).toBeInTheDocument()
    // AND the help tip should be called with the correct props
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_SUCCESS,
      children: HELP_TIP_TEXT.SUCCESS
    }, {})

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(statusField).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Critical Errors", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with critical errors import state.
    const importProcessState = States.CompletedWithCriticalErrors.args?.importProcessState!;
    // AND GIVEN a dataTestId
    const dataTestId = "import-status-property-field";

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} dataTestId={dataTestId}/>);

    // THEN the status field should be rendered.
    const statusField = screen.getByTestId(dataTestId)
    expect(statusField).toBeInTheDocument()

    // THEN it should display the failed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_FAILED)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be shown
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    // AND the message should have the expected text
    expect(screen.getByText(MESSAGE_TEXT.COMPLETED_ERROR)).toBeInTheDocument()
    // AND the message should have a help tip for error
    const errorHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_ERROR)
    expect(errorHelpTip).toBeInTheDocument()
    // AND the help tip should be called with the correct props
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_ERROR,
      children: HELP_TIP_TEXT.ERROR
    }, {})

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(statusField).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Parsing Errors", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with parsing errors import state.
    const importProcessState = States.CompletedWithParsingErrors.args?.importProcessState!;
    // AND GIVEN a dataTestId
    const dataTestId = "import-status-property-field";

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} dataTestId={dataTestId}/>);

    // THEN the status field should be rendered.
    const statusField = screen.getByTestId(dataTestId)
    expect(statusField).toBeInTheDocument()

    // THEN it should display the failed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_FAILED)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be shown
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    // AND the message should have the expected text
    expect(screen.getByText(MESSAGE_TEXT.COMPLETED_PARSING_ERROR)).toBeInTheDocument()
    // AND the message should have a help tip for parsing error
    const parsingErrorHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_PARSING_ERROR)
    expect(parsingErrorHelpTip).toBeInTheDocument()
    // AND the help tip should be called with the correct props
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_PARSING_ERROR,
      children: HELP_TIP_TEXT.PARSING_ERROR
    }, {})

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(statusField).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Parsing Warnings", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with parsing warnings import state.
    const importProcessState = States.CompletedWithParsingWarnings.args?.importProcessState!;
// AND GIVEN a dataTestId
    const dataTestId = "import-status-property-field";

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} dataTestId={dataTestId}/>);

    // THEN the status field should be rendered.
    const statusField = screen.getByTestId(dataTestId)
    expect(statusField).toBeInTheDocument()

    // THEN it should display the failed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_FAILED)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be shown
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    // AND the message should have the expected text
    expect(screen.getByText(MESSAGE_TEXT.COMPLETED_PARSING_WARNING)).toBeInTheDocument()
    // AND the message should have a help tip for parsing warning
    const parsingWarningHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_PARSING_WARNING)
    expect(parsingWarningHelpTip).toBeInTheDocument()
    // AND the help tip should be called with the correct props
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_PARSING_WARNING,
      children: HELP_TIP_TEXT.PARSING_WARNING
    }, {})

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(statusField).toMatchSnapshot()
  })

  it("Should Render correctly for Completed With Parsing Errors and Parsing Warnings", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with parsing errors and parsing warnings import state.
    const importProcessState = States.CompletedWithParsingWarningsAndParsingErrors.args?.importProcessState!;
    // AND GIVEN a dataTestId
    const dataTestId = "import-status-property-field";

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} dataTestId={dataTestId}/>);

    // THEN the status field should be rendered.
    const statusField = screen.getByTestId(dataTestId)
    expect(statusField).toBeInTheDocument()

    // THEN it should display the failed status icon
    const statusIcon = screen.getByTestId(ICON_DATA_TEST_ID.ICON_STATUS_FAILED)
    expect(statusIcon).toBeInTheDocument()

    // AND the message should be shown
    const message = screen.getByTestId(DATA_TEST_ID.MESSAGE)
    expect(message).toBeInTheDocument();
    // AND the message should have a help tip for parsing error
    const parsingErrorHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_PARSING_ERROR)
    expect(parsingErrorHelpTip).toBeInTheDocument()
    // AND the message should have a help tip for parsing warning
    const parsingWarningHelpTip = within(message).getByTestId(DATA_TEST_ID.HELP_TIP_PARSING_WARNING)
    expect(parsingWarningHelpTip).toBeInTheDocument()
    // AND the help tip should be called with the correct props for parsing error
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_PARSING_ERROR,
      children: HELP_TIP_TEXT.PARSING_ERROR
    }, {})
    // AND the help tip should be called with the correct props for parsing warning
    expect(HelpTip).toHaveBeenCalledWith({
      "data-testid": DATA_TEST_ID.HELP_TIP_PARSING_WARNING,
      children: HELP_TIP_TEXT.PARSING_WARNING
    }, {})

    // AND no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND it should match the snapshot
    expect(statusField).toMatchSnapshot()
  })

  it("Should return unexpected result message when completed with an Invalid status", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with completed with a case that won't exist
    const importProcessState: ModelInfoTypes.ImportProcessState = {
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
    expect(screen.getByText("Completed with unexpected results")).toBeInTheDocument();
  })

  test("Should return unknown status when the status is unknown", () => {
    // GIVEN the ImportStatusPropertyField component is rendered with an unknown status
    const importProcessState: ModelInfoTypes.ImportProcessState = {
      id: uuid(),
      // @ts-ignore
      status: "unknown",
      result: {
        errored: true,
        parsingErrors: true,
        parsingWarnings: true
      }
    };

    // WHEN the component mounts
    render(<ImportStatusPropertyField importProcessState={importProcessState} fieldId={id} />);

    // THEN it should return unknown status
    expect(screen.getByText("Unknown Status")).toBeInTheDocument();
  });
})
