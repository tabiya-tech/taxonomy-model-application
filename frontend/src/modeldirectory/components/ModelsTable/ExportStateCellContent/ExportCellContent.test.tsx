// mock the console
import "src/_test_utilities/consoleMock";
import { render, screen } from "src/_test_utilities/test-utils";
import { DATA_TEST_ID, ExportStateCellContent } from "./ExportStateCellContent";
import DownloadModelButton from "src/modeldirectory/components/DownloadModelButton/DownloadModelButton";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { getAllExportProcessStatePermutations } from "src/modeldirectory/components/ExportProcessStateIcon/_test_utilities/exportProcesStateTestData";
import ExportProcessStateIcon from "src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon";
import { randomUUID } from "crypto";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ExportProcessState = ModelInfoTypes.ExportProcessState;

// mock the ExportProcessStateIcon component
jest.mock("src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon", () => {
  const mock = jest.fn(() => {
    return <div data-testid={"mock-ExportProcessState-icon"} />;
  });
  return {
    __esModule: true,
    ExportProcessStateIcon: mock,
    default: mock,
  };
});

jest.mock("src/modeldirectory/components/DownloadModelButton/DownloadModelButton", () => {
  const mock = jest.fn(() => {
    return <div data-testid={"mock-DownLoadButton-icon"} />;
  });
  return {
    __esModule: true,
    DownloadModelButton: mock,
    default: mock,
  };
});

function getAllNotSuccessfulExportProcessStates() {
  return getAllExportProcessStatePermutations().filter((exportProcessState) => {
    return (
      exportProcessState.status !== ExportProcessStateAPISpecs.Enums.Status.COMPLETED ||
      exportProcessState.result.errored ||
      exportProcessState.result.exportErrors ||
      exportProcessState.result.exportWarnings
    );
  });
}

describe("ExportStateCellContent", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });
  // when there is no export process state
  // THEN expect nothing to be rendered
  test("should render nothing when there is no export process state", () => {
    // GIVEN some model with no export process state
    const givenModel = getOneFakeModel(1);
    givenModel.exportProcessState = [];

    // WHEN the component is rendered
    render(<ExportStateCellContent model={givenModel} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND expect and empty div to be rendered
    const actualElement = screen.getByTestId(DATA_TEST_ID.EMPTY_DIV);
    expect(actualElement).toBeInTheDocument();
    // AND to have no children
    expect(actualElement).toBeEmptyDOMElement();
  });

  describe("should render the download button when the last export was successful", () => {
    function getSuccessfulExportProcessState(timestamp: number) {
      return {
        id: randomUUID(),
        status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
        result: {
          errored: false,
          exportErrors: false,
          exportWarnings: false,
        },
        downloadUrl: randomUUID(),
        timestamp: new Date(timestamp),
        createdAt: new Date(timestamp),
        updatedAt: new Date(new Date(timestamp).getTime() + 1000)
      };
    }

    const NumberOfNotSuccessfulExportProcessStates = getAllNotSuccessfulExportProcessStates().length;

    function getTestExportProcessStates(indexOfSuccessFull: number): ExportProcessState[] {
      const allStates = getAllNotSuccessfulExportProcessStates();
      // put the successful one in the middle of the list
      const l = allStates.slice(0, indexOfSuccessFull);
      const r = allStates.slice(indexOfSuccessFull);
      return l.concat([getSuccessfulExportProcessState(allStates.length)]).concat(r);
    }

    test.each([
      [
        "is the last in the export process state list",
        NumberOfNotSuccessfulExportProcessStates,
        getTestExportProcessStates(NumberOfNotSuccessfulExportProcessStates),
      ],
      ["is the first in the export process state list", 0, getTestExportProcessStates(0)],
      [
        "is in the middle of the export process state list",
        Math.round(NumberOfNotSuccessfulExportProcessStates / 2),
        getTestExportProcessStates(Math.round(NumberOfNotSuccessfulExportProcessStates / 2)),
      ],
      ["is the only one in the export process state list", 0, [getSuccessfulExportProcessState(0)]],
    ])(
      "should render the download button when the latest successful %s",
      (description, givenIndexOfSuccessFull, givenExportProcessStates) => {
        // GIVEN some model with the given export process states
        const givenModel = getOneFakeModel(1);
        givenModel.exportProcessState = givenExportProcessStates;

        // WHEN the component is rendered
        render(<ExportStateCellContent model={givenModel} />);

        // THEN expect no errors or warning to have occurred
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();

        // AND expect the download button to be rendered
        const actualElement = screen.getByTestId("mock-DownLoadButton-icon");
        expect(actualElement).toBeInTheDocument();

        // AND to match the snapshot
        expect(actualElement).toMatchSnapshot();

        // AND to have been called with the correct props
        expect(DownloadModelButton as jest.Mock).toHaveBeenCalledWith(
          {
            downloadUrl: givenModel.exportProcessState[givenIndexOfSuccessFull].downloadUrl,
          },
          {}
        );
      }
    );
  });

  describe.each(
    getAllNotSuccessfulExportProcessStates().map((exportProcessState, index) => {
      return [index, exportProcessState];
    })
  )(
    `should render the export process state icon when the last export was not successful`,
    (index, givenExportStatus) => {
      test(`${index} - ${givenExportStatus.status} - ${JSON.stringify(givenExportStatus.result)}`, () => {
        // GIVEN some model with no export process state
        const givenModel = getOneFakeModel(1);
        givenModel.exportProcessState = [givenExportStatus];

        // WHEN the component is rendered
        render(<ExportStateCellContent model={givenModel} />);

        // THEN expect no errors or warning to have occurred
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();

        // AND expect the download button to be rendered
        const actualElement = screen.getByTestId("mock-ExportProcessState-icon");
        expect(actualElement).toBeInTheDocument();

        // AND to match the snapshot
        expect(actualElement).toMatchSnapshot();

        // AND to have been called with the correct props
        expect(ExportProcessStateIcon as jest.Mock).toHaveBeenCalledWith(
          {
            exportProcessState: givenModel.exportProcessState[0],
          },
          {}
        );
      });
    }
  );
});
