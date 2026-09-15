// mute the console
import "src/_test_utilities/consoleMock";

import * as React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import { getAllImportProcessStatePermutations } from "./_test_utilities/importProcesStateTestData";
import ImportProcessStateIcon, { DATA_TEST_ID } from "./ImportProcessStateIcon";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { IMPORT_PROCESS_STATUS } from "src/api-types";

const allIconTestIds = [
  DATA_TEST_ID.ICON_STATUS_PENDING,
  DATA_TEST_ID.ICON_STATUS_SUCCESS,
  DATA_TEST_ID.ICON_STATUS_FAILED,
  DATA_TEST_ID.ICON_STATUS_RUNNING,
  DATA_TEST_ID.ICON_STATUS_UNKNOWN,
];

describe("ImportProcessStateIcon", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("all icons are rendered", () => {
    // GIVEN a list of all possible import process states
    getAllImportProcessStatePermutations().forEach((importProcessState) => {
      // WHEN rendering the component
      render(
        <>
          {getAllImportProcessStatePermutations().map((importProcessState) => {
            return <ImportProcessStateIcon key={importProcessState.id} importProcessState={importProcessState} />;
          })}
          {
            // @ts-ignore
            <ImportProcessStateIcon importProcessState={null} />
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
    getAllImportProcessStatePermutations()
      .filter((importProcessState) => {
        return importProcessState.status === IMPORT_PROCESS_STATUS.PENDING;
      })
      .map((importProcessState, index) => {
        return [index, importProcessState];
      })
  )(`Correct ICON_STATUS_SUCCESS is rendered for ${IMPORT_PROCESS_STATUS.PENDING}`, (index, givenExportStatus) => {
    testImportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_PENDING);
  });

  describe.each(
    getAllImportProcessStatePermutations()
      .filter((importProcessState) => {
        return importProcessState.status === IMPORT_PROCESS_STATUS.RUNNING;
      })
      .map((importProcessState, index) => {
        return [index, importProcessState];
      })
  )(`Correct ICON_STATUS_SUCCESS is rendered for ${IMPORT_PROCESS_STATUS.RUNNING}`, (index, givenExportStatus) => {
    testImportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_RUNNING);
  });

  describe.each(
    getAllImportProcessStatePermutations()
      .filter((importProcessState) => {
        return (
          importProcessState.status === IMPORT_PROCESS_STATUS.COMPLETED &&
          !importProcessState.result.errored &&
          !importProcessState.result.parsingErrors &&
          !importProcessState.result.parsingWarnings
        );
      })
      .map((importProcessState, index) => {
        return [index, importProcessState];
      })
  )(`Correct ICON_STATUS_SUCCESS is rendered for ${IMPORT_PROCESS_STATUS.COMPLETED}`, (index, givenExportStatus) => {
    testImportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_SUCCESS);
  });

  describe.each(
    getAllImportProcessStatePermutations()
      .filter((importProcessState) => {
        return (
          importProcessState.status === IMPORT_PROCESS_STATUS.COMPLETED &&
          (importProcessState.result.errored ||
            importProcessState.result.parsingErrors ||
            importProcessState.result.parsingWarnings)
        );
      })
      .map((importProcessState, index) => {
        return [index, importProcessState];
      })
  )(`Correct ICON_STATUS_FAILED is rendered for ${IMPORT_PROCESS_STATUS.COMPLETED}`, (index, givenExportStatus) => {
    testImportProcessStateIcon(index, givenExportStatus, DATA_TEST_ID.ICON_STATUS_FAILED);
  });
});

function testImportProcessStateIcon(
  caseIndex: number,
  givenImportState: ModelInfoTypes.ImportProcessState,
  expectedIconTestId: string
) {
  return test(`${caseIndex} - ${JSON.stringify(givenImportState.result)}`, () => {
    // WHEN the icon is rendered when the status is given state
    render(<ImportProcessStateIcon importProcessState={givenImportState} />);
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
