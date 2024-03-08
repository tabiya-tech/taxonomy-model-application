// mute the console
import "src/_test_utilities/consoleMock";

import HelpTip from "src/theme/HelpTip/HelpTip";
import ExportStatusPropertyField, { HELP_TIP_TEXT } from "./ExportStatusPropertyField";
import ExportProcessStateEnums from "api-specifications/exportProcessState/enums";
import { v4 as uuid } from "uuid";
import { render, screen } from "src/_test_utilities/test-utils";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { DATA_TEST_ID as ICON_DATA_TEST_ID } from "src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon";

import ExportProcessState = ModelInfoTypes.ExportProcessState;

// mock the HelpTip Component
jest.mock("src/theme/HelpTip/HelpTip", () => {
  return {
    __esModule: true,
    default: jest.fn((props: any) => {
      return <span data-testid={props["data-testid"]}>{props.children}</span>;
    }),
  };
});

const cases = [
  {
    name: "Pending",
    state: {
      status: ExportProcessStateEnums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_PENDING,
    checkedMessages: ["Pending"],
    helpTipMessages: [HELP_TIP_TEXT.PENDING],
  },
  {
    name: "Running",
    state: {
      status: ExportProcessStateEnums.Status.RUNNING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_RUNNING,
    checkedMessages: ["Running"],
    helpTipMessages: [HELP_TIP_TEXT.RUNNING],
  },
  {
    name: "Completed",
    state: {
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_COMPLETED,
    checkedMessages: ["Completed successfully"],
    helpTipMessages: [HELP_TIP_TEXT.SUCCESS],
  },
  {
    name: "Completed With Critical Errors",
    state: {
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: true,
        exportErrors: false,
        exportWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_COMPLETED,
    checkedMessages: ["Completed with", "critical errors"],
    helpTipMessages: [HELP_TIP_TEXT.ERROR],
  },
  {
    name: "Completed With Export Errors",
    state: {
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportErrors: true,
        exportWarnings: false,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_COMPLETED,
    checkedMessages: ["Completed with", "export errors"],
    helpTipMessages: [HELP_TIP_TEXT.EXPORT_ERROR],
  },
  {
    name: "Completed With Export Warnings",
    state: {
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: true,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_COMPLETED,
    checkedMessages: ["Completed with", "export warnings"],
    helpTipMessages: [HELP_TIP_TEXT.EXPORT_WARNING],
  },
  {
    name: "Completed With Export Errors and Export Warnings",
    state: {
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportErrors: true,
        exportWarnings: true,
      },
    },
    icon: ICON_DATA_TEST_ID.ICON_STATUS_COMPLETED,
    checkedMessages: ["Completed with", "export errors", "export warnings"],
    helpTipMessages: [HELP_TIP_TEXT.EXPORT_ERROR, HELP_TIP_TEXT.EXPORT_WARNING],
  },
];

describe("ExportStatusPropertyField", () => {
  test.each(cases)(`Should Render correctly when export process is '$name'`, (testCase) => {
    // GIVEN the export process state
    const exportProcessState: ExportProcessState = {
      id: uuid(),
      status: testCase.state?.status!,
      result: testCase.state?.result!,
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    };
    // AND a data-testid
    const givenDataTestId = "export-status-details";
    // AND a unique fieldId
    const id = "field-id";

    // WHEN the component is rendered
    render(
      <ExportStatusPropertyField exportProcessState={exportProcessState} fieldId={id} data-testid={givenDataTestId} />
    );

    // THEN expect no errors or warnings should have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be shown
    const propertyFieldLayoutComponent = screen.getByTestId(givenDataTestId);
    expect(propertyFieldLayoutComponent).toBeInTheDocument();
    // AND it should display the correct status icon if it is not unknown
    const statusIcon = screen.getByTestId(testCase.icon);
    expect(statusIcon).toBeInTheDocument();
    // AND it should display the correct message
    testCase.checkedMessages.forEach((message) => {
      expect(screen.getAllByText(message).length).toBeGreaterThanOrEqual(1);
    });
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
    // GIVEN the export process state is invalid
    const exportProcessState: ExportProcessState = {
      id: uuid(),
      // @ts-ignore
      status: "INVALID_STATUS",
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    };
    const givenInvalidStatus = "INVALID_STATUS";
    // @ts-ignore
    exportProcessState.status = givenInvalidStatus;
    // AND a data-testid
    const givenDataTestId = "export-status-details";
    // AND a unique fieldId
    const id = "field-id";

    // WHEN the component is rendered
    render(
      <ExportStatusPropertyField exportProcessState={exportProcessState} fieldId={id} data-testid={givenDataTestId} />
    );

    // THEN it should return unknown status
    expect(screen.getByText("Completed with unexpected status " + givenInvalidStatus)).toBeInTheDocument();
  });
});
