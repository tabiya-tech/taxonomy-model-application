// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen, within } from "src/_test_utilities/test-utils";
import ModelsTable, { CELL_MAX_LENGTH, DATA_TEST_ID, TEXT } from "./ModelsTable";
import {
  fakeModel,
  getArrayOfFakeModels,
  getArrayOfRandomModelsMaxLength,
  getOneRandomModelMaxLength,
} from "./_test_utilities/mockModelData";
import * as React from "react";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

function encodeHtmlAttribute(value: string) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

// mock the ImportProcessStateIcon
jest.mock("src/modeldirectory/components/importProcessStateIcon/ImportProcessStateIcon", () => {
  const actual = jest.requireActual("src/modeldirectory/components/importProcessStateIcon/ImportProcessStateIcon");
  const mockImportProcessStateIcon = jest.fn().mockImplementation(() => {
    return <div data-testid="mock-state-icon"></div>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockImportProcessStateIcon,
  };
});

import ImportProcessStateIcon from "src/modeldirectory/components/importProcessStateIcon/ImportProcessStateIcon";

// mock the TableLoadingRows
jest.mock("src/modeldirectory/components/tableLoadingRows/TableLoadingRows", () => {
  const actual = jest.requireActual("src/modeldirectory/components/tableLoadingRows/TableLoadingRows");
  const actualModelsTable = jest.requireActual("src/modeldirectory/components/modelTables/ModelsTable"); // need this just to be able to access the DATA_TEST_ID.MODELS_LOADER
  const mockTableLoadingBody = jest.fn().mockImplementation(() => {
    return <tr data-testid={actualModelsTable.DATA_TEST_ID.MODELS_LOADER}></tr>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockTableLoadingBody,
  };
});

import TableLoadingRows from "src/modeldirectory/components/tableLoadingRows/TableLoadingRows";

describe("ModelsTable", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render the table with the models", () => {
    // GIVEN n models with random data of max length
    const givenModels = getArrayOfRandomModelsMaxLength(3);

    // WHEN the ModelsTable is rendered with the given models
    const { container } = render(<ModelsTable models={givenModels} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND the table to be shown
    const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
    expect(tableElement).toBeInTheDocument();

    // AND the table to have a header row
    const actualModelTableHeaderRow = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
    expect(actualModelTableHeaderRow).toBeInTheDocument();
    const actualHeaderCells = within(actualModelTableHeaderRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);

    // AND the NAME header cell to be shown
    const actualModelNameHeaderIndex = actualHeaderCells.findIndex(
      (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_NAME
    );
    expect(actualModelNameHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelNameHeaderCell = actualHeaderCells[actualModelNameHeaderIndex];
    expect(actualModelNameHeaderCell).toBeInTheDocument();

    // AND the LOCALE header cell to be shown
    const actualModelLocaleNameHeaderIndex = actualHeaderCells.findIndex(
      (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_LOCALE
    );
    expect(actualModelLocaleNameHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelLocaleNameHeaderCell = actualHeaderCells[actualModelLocaleNameHeaderIndex];
    expect(actualModelLocaleNameHeaderCell).toBeInTheDocument();

    // AND the VERSION header cell to be shown
    const actualModelVersionHeaderIndex = actualHeaderCells.findIndex(
      (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_VERSION
    );
    expect(actualModelVersionHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelVersionHeaderCell = actualHeaderCells[actualModelVersionHeaderIndex];
    expect(actualModelVersionHeaderCell).toBeInTheDocument();

    // AND the RELEASED header cell to be shown
    const actualModelReleasedHeaderIndex = actualHeaderCells.findIndex(
      (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_RELEASED
    );
    expect(actualModelReleasedHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelReleasedHeaderCell = actualHeaderCells[actualModelReleasedHeaderIndex];
    expect(actualModelReleasedHeaderCell).toBeInTheDocument();

    // AND the STATUS header cell to be shown
    const actualModelStatusHeaderIndex = actualHeaderCells.findIndex(
      // @ts-ignore
      (headerCell) => headerCell.attributes["aria-label"].value === TEXT.TABLE_HEADER_LABEL_STATUS
    );
    expect(actualModelStatusHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelStatusHeaderCell = actualHeaderCells[actualModelStatusHeaderIndex];
    expect(actualModelStatusHeaderCell).toBeInTheDocument();

    // AND the DESCRIPTION header cell to be shown
    const actualModelDescriptionHeaderIndex = actualHeaderCells.findIndex(
      (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_DESCRIPTION
    );
    expect(actualModelDescriptionHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelDescriptionHeaderCell = actualHeaderCells[actualModelDescriptionHeaderIndex];
    expect(actualModelDescriptionHeaderCell).toBeInTheDocument();

    // AND all models to be in the table
    const modelTableRows = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
    expect(modelTableRows.length).toEqual(givenModels.length);

    // AND each model to be correctly shown in a row
    givenModels.forEach((model) => {
      // the given model row to be in the table
      // eslint-disable-next-line testing-library/no-node-access,testing-library/no-container
      const actualModelRow = container.querySelector(
        `[data-modelid="${encodeHtmlAttribute(model.id)}"]`
      ) as HTMLElement;
      expect(actualModelRow).toBeInTheDocument();

      const actualModelCells = within(actualModelRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
      // AND the model's NAME to be shown in the correct column
      expect(actualModelCells[actualModelNameHeaderIndex]).toHaveTextContent(model.name);

      // AND the model's LOCALE to be shown in the correct column
      expect(actualModelCells[actualModelLocaleNameHeaderIndex]).toHaveTextContent(
        model.locale.name && model.locale.shortCode
      );

      // AND the model's VERSION to be shown in the correct column
      expect(actualModelCells[actualModelVersionHeaderIndex]).toHaveTextContent(model.version);

      // AND the model's STATUS icon to be shown in the correct column
      const actualModelStatusIcon = within(actualModelCells[actualModelStatusHeaderIndex]).getByTestId(
        DATA_TEST_ID.MODEL_CELL_STATUS_ICON_CONTAINER
      );
      expect(actualModelStatusIcon).toBeInTheDocument();

      // AND the model's RELEASE to be shown in the correct column
      let expectedReleasedContent = "";
      if (model.released) {
        const icon = within(actualModelCells[actualModelReleasedHeaderIndex]).getByTestId(
          DATA_TEST_ID.MODEL_CELL_RELEASED_ICON
        );
        expectedReleasedContent = icon.innerHTML;
      }
      expect(actualModelCells[actualModelReleasedHeaderIndex]).toContainHTML(expectedReleasedContent);

      // AND the model's DESCRIPTION to be shown in the correct column
      let expectedDescription = "";
      if (model.description.length > CELL_MAX_LENGTH) {
        expectedDescription = model.description.substring(0, CELL_MAX_LENGTH) + "...";
      } else {
        expectedDescription = model.description;
      }
      expect(actualModelCells[actualModelDescriptionHeaderIndex]).toHaveTextContent(expectedDescription);
    });
  });

  test("should render the table and match the snapshot", () => {
    // GIVEN a model
    const givenModel = fakeModel;

    // WHEN the ModelsTable is rendered with the given model
     // @ts-ignore
    render(<ModelsTable models={givenModel} />);

    // THEN expect the table to be show
    const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
    expect(tableElement).toBeInTheDocument();
    expect(tableElement).toMatchSnapshot(DATA_TEST_ID.MODELS_TABLE_ID);
  });

  test.each([
    ["empty", []],
    ["null ", null],
    ["undefined", undefined],
  ])("should render an empty table with %s models array", async (description, givenModels) => {
    // GIVEN an empty model list is provided

    // WHEN the ModelsTable is rendered
    // @ts-ignore
    render(<ModelsTable models={givenModels} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND expect the table to be shown
    const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
    expect(tableElement).toBeInTheDocument();
    // AND the table to have a header row
    const actualModelTableHeaderRow = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
    expect(actualModelTableHeaderRow).toBeInTheDocument();
    // AND the header row to have a name cell
    const actualNameHeaderCell = await within(actualModelTableHeaderRow).findByText(TEXT.TABLE_HEADER_LABEL_NAME);
    expect(actualNameHeaderCell).toBeInTheDocument();
    // AND the header row to have a locale cell
    const actualLocaleHeaderCell = await within(actualModelTableHeaderRow).findByText(TEXT.TABLE_HEADER_LABEL_LOCALE);
    expect(actualLocaleHeaderCell).toBeInTheDocument();
    // AND the header row to have a Version cell
    const actualVersionHeaderCell = await within(actualModelTableHeaderRow).findByText(TEXT.TABLE_HEADER_LABEL_VERSION);
    expect(actualVersionHeaderCell).toBeInTheDocument();
    // AND the header row to have a Released cell
    const actualReleasedHeaderCell = await within(actualModelTableHeaderRow).findByText(
      TEXT.TABLE_HEADER_LABEL_RELEASED
    );
    expect(actualReleasedHeaderCell).toBeInTheDocument();
    // AND the header row to have a Description cell
    const actualDescriptionHeaderCell = await within(actualModelTableHeaderRow).findByText(
      TEXT.TABLE_HEADER_LABEL_DESCRIPTION
    );
    expect(actualDescriptionHeaderCell).toBeInTheDocument();
    // AND the table should not have any row
    const modelTableRows = screen.queryAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
    expect(modelTableRows).toHaveLength(0);
  });

  test("should initially render the models in descending order by createdAt", () => {
    // GIVEN an array of models
    const givenModels = getArrayOfFakeModels(5); // Adjust the number as needed
    const expectedModels = [...givenModels].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // WHEN we render the ModelsTable
    render(<ModelsTable models={givenModels} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND the models should be in sorted in Descending order by createdAt
    const renderedRows = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
    renderedRows.forEach((row, index) => {
      expect(row.getAttribute("data-modelid")).toBe(expectedModels[index].id);
    });
  });

  describe("should render the model.released", () => {
    test.each([[true], [false]])("should render model.released = %s", (givenIsReleasedFlag) => {
      // GIVEN n models with random data
      const givenModels = getArrayOfRandomModelsMaxLength(1);
      // AND a given released flag
      givenModels[0].released = givenIsReleasedFlag;

      // WHEN the ModelsTable is rendered
      render(<ModelsTable models={givenModels} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND expect the released to be rendered based on the value
      const tableHeader = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
      const headerCells = within(tableHeader).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
      const releasedCellIndex = headerCells.findIndex(
        (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_RELEASED
      );
      const actualModelRows = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);

      actualModelRows.forEach((actualRow, index) => {
        const actualRowCells = within(actualRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
        const actualReleasedCell = actualRowCells[releasedCellIndex];
        let expectedReleasedContent = "";
        if (givenIsReleasedFlag) {
          const icon = within(actualReleasedCell).getByTestId(DATA_TEST_ID.MODEL_CELL_RELEASED_ICON);
          expectedReleasedContent = icon.innerHTML;
        }
        expect(actualReleasedCell).toContainHTML(expectedReleasedContent);
      });
    });
  });

  describe("should render the model.description", () => {
    test.each([
      ["empty", ""],
      ["less than CELL_MAX_LENGTH", getRandomLorem(CELL_MAX_LENGTH - 1)],
      ["equal to CELL_MAX_LENGTH", getRandomLorem(CELL_MAX_LENGTH)],
      ["longer than to CELL_MAX_LENGTH", getRandomLorem(CELL_MAX_LENGTH + 1)],
    ])("should render the 'model.description' then it is %s", (desc, givenDescription) => {
      // GIVEN n models with random data of max length
      const givenModels = getArrayOfRandomModelsMaxLength(1);
      // AND a given description
      givenModels[0].description = givenDescription;

      // WHEN the ModelsTable is rendered
      render(<ModelsTable models={givenModels} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND expected the description to render based on it's length
      const tableHeader = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
      const headerCells = within(tableHeader).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
      const descriptionCellIndex = headerCells.findIndex(
        (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_DESCRIPTION
      );
      const actualModelRows = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);

      actualModelRows.forEach((row, index) => {
        const rowCells = within(row).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
        const descriptionCell = rowCells[descriptionCellIndex];
        let expectedDescription = "";
        if (givenDescription.length > CELL_MAX_LENGTH) {
          expectedDescription = givenDescription.substring(0, CELL_MAX_LENGTH) + "...";
        } else {
          expectedDescription = givenDescription;
        }
        expect(descriptionCell.textContent).toMatch(expectedDescription);
      });
    });
  });

  describe("should render the model.importStatus", () => {
    test("should render the model.importStatus", () => {
      // GIVEN a model with some Import status
      const givenModel = getOneRandomModelMaxLength();
      expect(givenModel.importProcessState).toBeDefined();

      // WHEN the ModelsTable is rendered with the given model
      render(<ModelsTable models={[givenModel]} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND expect the icon to be shown
      const actualModelCellStatusIconContainer = screen.getByTestId(DATA_TEST_ID.MODEL_CELL_STATUS_ICON_CONTAINER);
      const actualImportStatusIcon = within(actualModelCellStatusIconContainer).getByTestId("mock-state-icon");
      expect(actualImportStatusIcon).toBeInTheDocument();

      // AND expect the ImportProcessStateIcon to have been called with the given import status
      expect(ImportProcessStateIcon).toHaveBeenCalledWith({ importProcessState: givenModel.importProcessState }, {});
    });
  });

  describe("should render the table with the loader component when the loading property is set to true", () => {
    test("should render the table with the loader component when the loading property is set to true", () => {
      // GIVEN isLoading property is true
      const givenIsLoading = true;
      // AND an empty models list is provided
      const givenModels: ModelInfoTypes.ModelInfo[] = [];

      // WHEN the ModelsTable component is rendered with the given properties
      render(<ModelsTable models={givenModels} isLoading={givenIsLoading} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND expect the table to be shown
      const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
      expect(tableElement).toBeInTheDocument();
      // AND the table to have a header row
      const actualModelTableHeaderRow = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
      expect(actualModelTableHeaderRow).toBeInTheDocument();

      // AND the loader component to be shown
      const modelsLoaderElement = screen.getByTestId(DATA_TEST_ID.MODELS_LOADER);
      expect(modelsLoaderElement).toBeInTheDocument();

      // AND the loader component to have been called with same number of columns as the table header
      const actualModelTableHeaderCells = within(actualModelTableHeaderRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
      expect(TableLoadingRows).toHaveBeenCalledWith(
        {
          numberOfCols: actualModelTableHeaderCells.length,
          numberOfRows: expect.any(Number),
        },
        {}
      );

      // AND no model should be shown
      const modelTableDataRowElement = screen.queryByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
      expect(modelTableDataRowElement).not.toBeInTheDocument();
    });

    test("should render the table without the loader component when the loading property is false", () => {
      // GIVEN the loading property is false
      const givenIsLoading = false;
      // AND n models are provided
      const givenModels: ModelInfoTypes.ModelInfo[] = getArrayOfRandomModelsMaxLength(3);

      // WHEN the ModelsTable component is rendered with the given properties
      render(<ModelsTable models={givenModels} isLoading={givenIsLoading} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND expect the table to be shown
      const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
      expect(tableElement).toBeInTheDocument();
      // AND the table to have a header row
      const actualModelTableHeaderRow = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
      expect(actualModelTableHeaderRow).toBeInTheDocument();
      // AND the given models to be shown
      const modelTableDataRowElements = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
      expect(modelTableDataRowElements).toHaveLength(givenModels.length);
      // AND the loader component to not be shown
      const modelsLoaderElement = screen.queryByTestId(DATA_TEST_ID.MODELS_LOADER);
      expect(modelsLoaderElement).not.toBeInTheDocument();
    });

    test("should not render the loader component when the table contains some models", () => {
      // GIVEN n models are provided
      const givenModels = getArrayOfRandomModelsMaxLength(3);

      // WHEN the ModelsTable component is rendered with the given models
      render(<ModelsTable models={givenModels} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND expect the given models to be shown
      const modelTableDataRowElements = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
      expect(modelTableDataRowElements).toHaveLength(givenModels.length);
      // AND the loader component to not be shown
      const modelsLoaderElement = screen.queryByTestId(DATA_TEST_ID.MODELS_LOADER);
      expect(modelsLoaderElement).not.toBeInTheDocument();
    });
  });
});
