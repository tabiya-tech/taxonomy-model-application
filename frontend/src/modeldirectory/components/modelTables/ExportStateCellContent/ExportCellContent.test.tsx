// mock the console
import "src/_test_utilities/consoleMock";
import { render, screen } from "src/_test_utilities/test-utils";
import { DATA_TEST_ID, ExportStateCellContent } from "./ExportStateCellContent";
import DownloadModelButton from "src/modeldirectory/components/DownloadModelButton/DownloadModelButton";
import { getOneFakeModel } from "src/modeldirectory/components/modelTables/_test_utilities/mockModelData";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { getAllExportProcessStatePermutations } from "src/modeldirectory/components/exportProcessStateIcon/_test_utilities/exportProcesStateTestData";
import ExportProcessStateIcon from "src/modeldirectory/components/exportProcessStateIcon/exportProcessStateIcon";

// mock the ExportProcessStateIcon component
jest.mock("src/modeldirectory/components/exportProcessStateIcon/exportProcessStateIcon", () => {
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

describe("ExportStateCellContent", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  // when there is no export process state
  // THEN expect nothing to be rendered
  test("should render nothing when there is no export process state", () => {
    // GIVEN a model with no export process state
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

  test("should render the download button when the last export was successful and there were no errors or warnings", () => {
    // GIVEN a model with no export process state
    const givenModel = getOneFakeModel(1);
    givenModel.exportProcessState = [
      {
        id: "foo",
        status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
        result: {
          errored: false,
          exportErrors: false,
          exportWarnings: false,
        },
        downloadUrl: "https://foo/bar",
        timestamp: new Date(),
      },
    ];

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
        downloadUrl: givenModel.exportProcessState[0].downloadUrl,
      },
      {}
    );
  });

  // when the last export was not successful ( pending, running, failed )
  // THEN expect the export process state icon to be rendered

  describe.each(
    getAllExportProcessStatePermutations()
      .filter((exportProcessState) => {
        return (
          exportProcessState.status !== ExportProcessStateAPISpecs.Enums.Status.COMPLETED ||
          exportProcessState.result.errored ||
          exportProcessState.result.exportErrors ||
          exportProcessState.result.exportWarnings
        );
      })
      .map((exportProcessState, index) => {
        return [index, exportProcessState];
      })
  )(
    `should render the export process state icon when the last export was not successful`,
    (index, givenExportStatus) => {
      test(`${index} - ${givenExportStatus.status} - ${JSON.stringify(givenExportStatus.result)}`, () => {
        // GIVEN a model with no export process state
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
