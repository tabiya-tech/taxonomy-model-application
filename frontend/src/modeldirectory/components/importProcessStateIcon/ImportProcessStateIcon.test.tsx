// mute the console
import "src/_test_utilities/consoleMock";

import * as React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import { getAllImportProcessStatePermutations } from "./_test_utilities/importProcesStateTestData";
import ImportProcessStateIcon, { DATA_TEST_ID } from "./ImportProcessStateIcon";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";

describe("ImportProcessStateIcon", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  const allIconTestIds = [
    DATA_TEST_ID.ICON_STATUS_PENDING,
    DATA_TEST_ID.ICON_STATUS_SUCCESS,
    DATA_TEST_ID.ICON_STATUS_FAILED,
    DATA_TEST_ID.ICON_STATUS_RUNNING,
    DATA_TEST_ID.ICON_STATUS_UNKNOWN,
  ];
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

  test.each([
    getAllImportProcessStatePermutations().filter((importProcessState) => {
      return importProcessState.status === ImportProcessStateAPISpecs.Enums.Status.PENDING;
    }),
  ])(
    `the icon ICON_STATUS_PENDING is rendered for status  ${ImportProcessStateAPISpecs.Enums.Status.PENDING}`,
    (givenImportStatus) => {
      // DATA_TEST_ID.ICON_STATUS_PENDING is rendered when the status is PENDING
      render(<ImportProcessStateIcon importProcessState={givenImportStatus} />);
      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(screen.getAllByTestId(DATA_TEST_ID.ICON_STATUS_PENDING)[0]).toBeInTheDocument();
      // and no other icon is rendered
      allIconTestIds
        .filter((testId) => {
          return testId !== DATA_TEST_ID.ICON_STATUS_PENDING;
        })
        .forEach((testId) => {
          expect(screen.queryAllByTestId(testId).length).toBe(0);
        });
    }
  );

  test.each([
    getAllImportProcessStatePermutations().filter((importProcessState) => {
      return importProcessState.status === ImportProcessStateAPISpecs.Enums.Status.RUNNING;
    }),
  ])(
    `the correct ICON_STATUS_RUNNING is rendered for ${ImportProcessStateAPISpecs.Enums.Status.RUNNING}`,
    (givenImportStatus) => {
      // DATA_TEST_ID.ICON_STATUS_PENDING is rendered when the status is PENDING
      render(<ImportProcessStateIcon importProcessState={givenImportStatus} />);
      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(screen.getAllByTestId(DATA_TEST_ID.ICON_STATUS_RUNNING)[0]).toBeInTheDocument();
      // and no other icon is rendered
      allIconTestIds
        .filter((testId) => {
          return testId !== DATA_TEST_ID.ICON_STATUS_RUNNING;
        })
        .forEach((testId) => {
          expect(screen.queryAllByTestId(testId).length).toBe(0);
        });
    }
  );

  test.each([
    getAllImportProcessStatePermutations().filter((importProcessState) => {
      return (
        importProcessState.status === ImportProcessStateAPISpecs.Enums.Status.COMPLETED &&
        !importProcessState.result.errored &&
        !importProcessState.result.parsingErrors &&
        !importProcessState.result.parsingWarnings
      );
    }),
  ])(
    `the correct ICON_STATUS_SUCCESS is rendered for ${ImportProcessStateAPISpecs.Enums.Status.COMPLETED} and no error or parsing issues`,
    (givenImportStatus) => {
      // DATA_TEST_ID.ICON_STATUS_PENDING is rendered when the status is PENDING
      render(<ImportProcessStateIcon importProcessState={givenImportStatus} />);
      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(screen.getAllByTestId(DATA_TEST_ID.ICON_STATUS_SUCCESS)[0]).toBeInTheDocument();
      // and no other icon is rendered
      allIconTestIds
        .filter((testId) => {
          return testId !== DATA_TEST_ID.ICON_STATUS_SUCCESS;
        })
        .forEach((testId) => {
          expect(screen.queryAllByTestId(testId).length).toBe(0);
        });
    }
  );

  test.each([
    getAllImportProcessStatePermutations().filter((importProcessState) => {
      return (
        importProcessState.status === ImportProcessStateAPISpecs.Enums.Status.COMPLETED &&
        (importProcessState.result.errored ||
          importProcessState.result.parsingErrors ||
          importProcessState.result.parsingWarnings)
      );
    }),
  ])(
    `the correct ICON_STATUS_FAILED is rendered for ${ImportProcessStateAPISpecs.Enums.Status.COMPLETED} and no error or parsing issues`,
    (givenImportStatus) => {
      // DATA_TEST_ID.ICON_STATUS_PENDING is rendered when the status is PENDING
      render(<ImportProcessStateIcon importProcessState={givenImportStatus} />);
      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(screen.getAllByTestId(DATA_TEST_ID.ICON_STATUS_FAILED)[0]).toBeInTheDocument();
      // and no other icon is rendered
      allIconTestIds
        .filter((testId) => {
          return testId !== DATA_TEST_ID.ICON_STATUS_FAILED;
        })
        .forEach((testId) => {
          expect(screen.queryAllByTestId(testId).length).toBe(0);
        });
    }
  );
});
