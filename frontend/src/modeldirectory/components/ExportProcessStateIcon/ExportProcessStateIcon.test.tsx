// mute the console
import "src/_test_utilities/consoleMock";

import * as React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import { getAllExportProcessStatePermutations } from "./_test_utilities/exportProcesStateTestData";
import ExportProcessStateIcon, { DATA_TEST_ID } from "./ExportProcessStateIcon";
import ExportProcessStateAPISpecs from "api-specifications/importProcessState";
import { ModelInfoTypes } from "../../../modelInfo/modelInfoTypes";

const allIconTestIds = [
  DATA_TEST_ID.ICON_STATUS_PENDING,
  DATA_TEST_ID.ICON_STATUS_RUNNING,
  DATA_TEST_ID.ICON_STATUS_COMPLETED,
  DATA_TEST_ID.ICON_STATUS_UNKNOWN,
];
describe("ExportProcessStateIcon", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("all icons are rendered", () => {
    // GIVEN a list of all possible import process states
    getAllExportProcessStatePermutations().forEach((importProcessState) => {
      // WHEN rendering the component
      render(
        <>
          {getAllExportProcessStatePermutations().map((exportProcessState) => {
            return <ExportProcessStateIcon key={exportProcessState.id} exportProcessState={exportProcessState} />;
          })}
          {
            // @ts-ignore
            <ExportProcessStateIcon exportProcessState={null} />
          }
        </>
      );
      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND every icon to be rendered
      allIconTestIds.forEach((testId) => {
        expect(screen.queryAllByTestId(testId).length).toBeGreaterThan(0);
      });
    });
  });

  describe.each(
    getAllExportProcessStatePermutations()
      .filter((exportProcessState) => {
        return exportProcessState.status === ExportProcessStateAPISpecs.Enums.Status.PENDING;
      })
      .map((exportProcessState, index) => {
        return [index, exportProcessState];
      })
  )(
    `Correct ICON_STATUS_PENDING is rendered for ${ExportProcessStateAPISpecs.Enums.Status.PENDING}`,
    (index, givenExportStatus) => {
      testExportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_PENDING);
    }
  );

  describe.each(
    getAllExportProcessStatePermutations()
      .filter((exportProcessState) => {
        return exportProcessState.status === ExportProcessStateAPISpecs.Enums.Status.RUNNING;
      })
      .map((exportProcessState, index) => {
        return [index, exportProcessState];
      })
  )(
    `Correct ICON_STATUS_RUNNING is rendered for ${ExportProcessStateAPISpecs.Enums.Status.RUNNING}`,
    (index, givenExportStatus) => {
      testExportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_RUNNING);
    }
  );

  describe.each(
    getAllExportProcessStatePermutations()
      .filter((exportProcessState) => {
        return (
          exportProcessState.status === ExportProcessStateAPISpecs.Enums.Status.COMPLETED &&
          !exportProcessState.result.errored &&
          !exportProcessState.result.exportErrors &&
          !exportProcessState.result.exportWarnings
        );
      })
      .map((exportProcessState, index) => {
        return [index, exportProcessState];
      })
  )(
    `Correct ICON_STATUS_SUCCESS is rendered for ${ExportProcessStateAPISpecs.Enums.Status.COMPLETED}`,
    (index, givenExportStatus) => {
      testExportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_COMPLETED);
    }
  );

  describe.each(
    getAllExportProcessStatePermutations()
      .filter((exportProcessState) => {
        return (
          exportProcessState.status === ExportProcessStateAPISpecs.Enums.Status.COMPLETED &&
          (exportProcessState.result.errored ||
            exportProcessState.result.exportErrors ||
            exportProcessState.result.exportWarnings)
        );
      })
      .map((exportProcessState, index) => {
        return [index, exportProcessState];
      })
  )(
    `Correct ICON_STATUS_FAILED is rendered for ${ExportProcessStateAPISpecs.Enums.Status.COMPLETED}`,
    (index, givenExportStatus) => {
      testExportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_COMPLETED);
    }
  );
});

function testExportProcessStateIcon(
  caseIndex: number,
  givenExportState: ModelInfoTypes.ExportProcessState,
  expectedIconTestId: string
) {
  return test(`${caseIndex} - ${JSON.stringify(givenExportState.result)}`, () => {
    // WHEN the icon is rendered when the status is given state
    render(<ExportProcessStateIcon exportProcessState={givenExportState} />);
    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the icon is rendered
    const actualStatusIcon = screen.getByTestId(expectedIconTestId);
    expect(actualStatusIcon).toBeInTheDocument();
    // AND the icon matches the snapshot
    expect(actualStatusIcon).toMatchSnapshot();
    // and no other icon is rendered
    allIconTestIds
      .filter((testId) => {
        return testId !== expectedIconTestId;
      })
      .forEach((testId) => {
        expect(screen.queryAllByTestId(testId).length).toBe(0);
      });
  });
}
