// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen, within, act } from "src/_test_utilities/test-utils";
import ModelsTable, { CELL_MAX_LENGTH, DATA_TEST_ID, TEXT } from "./ModelsTable";
import {
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
    return <div data-testid="mock-import-state-icon"></div>;
  });

  return {
    ...actual,
    __esModule: true,
    ImportProcessStateIcon: mockImportProcessStateIcon,
    default: mockImportProcessStateIcon,
  };
});

jest.mock("src/modeldirectory/components/modelTables/ContextMenu/ContextMenu", () => {
  const actual = jest.requireActual("src/modeldirectory/components/modelTables/ContextMenu/ContextMenu");
  const mockContextMenu = jest.fn().mockImplementation(() => {
    return <div data-testid="mock-context-menu"></div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockContextMenu,
  };
});

import ImportProcessStateIcon from "src/modeldirectory/components/importProcessStateIcon/ImportProcessStateIcon";

// mock the ExportStateCellContent
jest.mock("src/modeldirectory/components/modelTables/ExportStateCellContent/ExportStateCellContent", () => {
  const actual = jest.requireActual(
    "src/modeldirectory/components/modelTables/ExportStateCellContent/ExportStateCellContent"
  );
  const mockExportStateCellContent = jest.fn().mockImplementation(() => {
    return <div data-testid="mock-export-state-content"></div>;
  });

  return {
    ...actual,
    __esModule: true,
    ExportStateCellContent: mockExportStateCellContent,
    default: mockExportStateCellContent,
  };
});

import ExportStateCellContent from "src/modeldirectory/components/modelTables/ExportStateCellContent/ExportStateCellContent";

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
import { fireEvent, waitFor } from "@testing-library/react";
import ContextMenu from "./ContextMenu/ContextMenu";

describe("ModelsTable", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    jest.clearAllMocks();
  });
  describe("render tests", () => {
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

      // expect to find the correct number of header cells
      const actualHeaderCells = within(actualModelTableHeaderRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
      expect(actualHeaderCells.length).toEqual(8);

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

      // AND the IMPORT STATE header cell to be shown
      const actualModelImportStateHeaderIndex = actualHeaderCells.findIndex(
        // @ts-ignore
        (headerCell) => headerCell.attributes["aria-label"]?.value === TEXT.TABLE_HEADER_LABEL_IMPORT_STATE
      );
      expect(actualModelImportStateHeaderIndex).toBeGreaterThanOrEqual(0);
      const actualModelImportStateHeaderCell = actualHeaderCells[actualModelImportStateHeaderIndex];
      expect(actualModelImportStateHeaderCell).toBeInTheDocument();

      // AND the EXPORT STATE header cell to be shown
      const actualModelExportStateHeaderIndex = actualHeaderCells.findIndex(
        // @ts-ignore
        (headerCell) => headerCell.attributes["aria-label"]?.value === TEXT.TABLE_HEADER_LABEL_EXPORT_STATE
      );
      expect(actualModelExportStateHeaderIndex).toBeGreaterThanOrEqual(0);
      const actualModelExportStateHeaderCell = actualHeaderCells[actualModelExportStateHeaderIndex];
      expect(actualModelExportStateHeaderCell).toBeInTheDocument();

      // AND the DESCRIPTION header cell to be shown
      const actualModelDescriptionHeaderIndex = actualHeaderCells.findIndex(
        (headerCell) => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_DESCRIPTION
      );
      expect(actualModelDescriptionHeaderIndex).toBeGreaterThanOrEqual(0);
      const actualModelDescriptionHeaderCell = actualHeaderCells[actualModelDescriptionHeaderIndex];
      expect(actualModelDescriptionHeaderCell).toBeInTheDocument();

      // AND the ACTIONS header cell to be shown
      const actualModelActionsHeaderIndex = actualHeaderCells.findIndex(
        // @ts-ignore
        (headerCell) => headerCell.attributes["aria-label"]?.value === TEXT.TABLE_HEADER_LABEL_MODEL_ACTIONS
      );
      expect(actualModelActionsHeaderIndex).toBeGreaterThanOrEqual(0);
      const actualModelActionsHeaderCell = actualHeaderCells[actualModelActionsHeaderIndex];
      expect(actualModelActionsHeaderCell).toBeInTheDocument();

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

        // AND the model's IMPORT STATE icon to be shown in the correct column
        const actualModelImportStateIcon = within(actualModelCells[actualModelImportStateHeaderIndex]).getByTestId(
          DATA_TEST_ID.MODEL_CELL_IMPORT_STATE_ICON_CONTAINER
        );
        expect(actualModelImportStateIcon).toBeInTheDocument();

        // AND the model's EXPORT STATE Cell to be shown in the correct column
        const actualModelExportStateCell = within(actualModelCells[actualModelExportStateHeaderIndex]).getByTestId(
          DATA_TEST_ID.MODEL_CELL_EXPORT_STATE_CONTAINER
        );
        expect(actualModelExportStateCell).toBeInTheDocument();

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
        let expectedDescription;
        if (model.description.length > CELL_MAX_LENGTH) {
          expectedDescription = model.description.substring(0, CELL_MAX_LENGTH) + "...";
        } else {
          expectedDescription = model.description;
        }
        expect(actualModelCells[actualModelDescriptionHeaderIndex]).toHaveTextContent(expectedDescription);

        // AND the more button to be shown in the correct column
        const actualModelMoreIcon = within(actualModelCells[actualModelActionsHeaderIndex]).getByTestId(
          DATA_TEST_ID.MODEL_CELL_MORE_BUTTON
        );
        expect(actualModelMoreIcon).toBeInTheDocument();
      });
    });

    test.each([
      ["empty", []],
      ["null ", null],
      ["undefined", undefined],
    ])("should render an empty table with %s models array", async (_description, givenModels) => {
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

      // expect to find the correct number of header cells
      const actualHeaderCells = within(actualModelTableHeaderRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
      expect(actualHeaderCells.length).toEqual(8);

      // AND the header row to have a IMPORT STATE cell
      const actualImportStateHeaderCell = within(actualModelTableHeaderRow).getByRole("columnheader", {
        name: TEXT.TABLE_HEADER_LABEL_IMPORT_STATE,
      });
      expect(actualImportStateHeaderCell).toBeInTheDocument();
      // AND the header row to have a EXPORT STATE cell
      const actualExportStateHeaderCell = within(actualModelTableHeaderRow).getByRole("columnheader", {
        name: TEXT.TABLE_HEADER_LABEL_EXPORT_STATE,
      });
      expect(actualExportStateHeaderCell).toBeInTheDocument();
      // AND the header row to have a NAME cell
      const actualNameHeaderCell = await within(actualModelTableHeaderRow).findByText(TEXT.TABLE_HEADER_LABEL_NAME);
      expect(actualNameHeaderCell).toBeInTheDocument();
      // AND the header row to have a LOCAL cell
      const actualLocaleHeaderCell = await within(actualModelTableHeaderRow).findByText(TEXT.TABLE_HEADER_LABEL_LOCALE);
      expect(actualLocaleHeaderCell).toBeInTheDocument();
      // AND the header row to have a VERSION cell
      const actualVersionHeaderCell = await within(actualModelTableHeaderRow).findByText(
        TEXT.TABLE_HEADER_LABEL_VERSION
      );
      expect(actualVersionHeaderCell).toBeInTheDocument();
      // AND the header row to have a RELEASE cell
      const actualReleasedHeaderCell = await within(actualModelTableHeaderRow).findByText(
        TEXT.TABLE_HEADER_LABEL_RELEASED
      );
      expect(actualReleasedHeaderCell).toBeInTheDocument();
      // AND the header row to have a DESCRIPTION cell
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

    describe("should render complex cells", () => {
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

          actualModelRows.forEach((actualRow, _index) => {
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
        ])("should render the 'model.description' then it is %s", (_desc, givenDescription) => {
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

          actualModelRows.forEach((row, _index) => {
            const rowCells = within(row).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
            const descriptionCell = rowCells[descriptionCellIndex];
            let expectedDescription;
            if (givenDescription.length > CELL_MAX_LENGTH) {
              expectedDescription = givenDescription.substring(0, CELL_MAX_LENGTH) + "...";
            } else {
              expectedDescription = givenDescription;
            }
            expect(descriptionCell.textContent).toMatch(expectedDescription);
          });
        });
      });

      describe("should render the model.importProcessState", () => {
        test("should render the model.importProcessState", () => {
          // GIVEN a model with some Import state
          const givenModel = getOneRandomModelMaxLength();
          expect(givenModel.importProcessState).toBeDefined();

          // WHEN the ModelsTable is rendered with the given model
          render(<ModelsTable models={[givenModel]} />);

          // THEN expect no errors or warning to have occurred
          expect(console.error).not.toHaveBeenCalled();
          expect(console.warn).not.toHaveBeenCalled();

          // AND expect the icon to be shown
          const actualModelCellImportStateIconContainer = screen.getByTestId(
            DATA_TEST_ID.MODEL_CELL_IMPORT_STATE_ICON_CONTAINER
          );
          const actualImportStateIcon = within(actualModelCellImportStateIconContainer).getByTestId(
            "mock-import-state-icon"
          );
          expect(actualImportStateIcon).toBeInTheDocument();

          // AND expect the ImportProcessStateIcon to have been called with the given import state
          expect(ImportProcessStateIcon).toHaveBeenCalledWith(
            { importProcessState: givenModel.importProcessState },
            {}
          );
        });
      });

      describe("should render the model.exportProcessState", () => {
        test("should render the model.exportProcessState", () => {
          // GIVEN a model with some Export Process State
          const givenModel = getOneRandomModelMaxLength();
          expect(givenModel.exportProcessState).toBeDefined();

          // WHEN the ModelsTable is rendered with the given model
          render(<ModelsTable models={[givenModel]} />);

          // THEN expect no errors or warning to have occurred
          expect(console.error).not.toHaveBeenCalled();
          expect(console.warn).not.toHaveBeenCalled();

          // AND expect the export content to be shown
          const actualModelCellExportStateContainer = screen.getByTestId(
            DATA_TEST_ID.MODEL_CELL_EXPORT_STATE_CONTAINER
          );
          const actualExportStateContent = within(actualModelCellExportStateContainer).getByTestId(
            "mock-export-state-content"
          );
          expect(actualExportStateContent).toBeInTheDocument();

          // AND expect the ImportProcessStateIcon to have been called with the given import state
          expect(ExportStateCellContent).toHaveBeenCalledWith({ model: givenModel }, {});
        });
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

  describe("action tests", () => {
    test("should display the ContextMenu when the 'more' button is clicked", async () => {
      // GIVEN that the ModelsTable is shown with N models
      const givenModels = getArrayOfRandomModelsMaxLength(5);
      render(<ModelsTable models={givenModels} />);

      // WHEN the more button is clicked for a model
      const actualButtons = screen.queryAllByTestId(DATA_TEST_ID.MODEL_CELL_MORE_BUTTON);
      const actualChosenIndex = 2; // choose and index that is not the first or last to avoid the edge cases
      const actualChosenButton = actualButtons[actualChosenIndex];
      fireEvent.click(actualChosenButton);

      // THEN expect the context menu to be shown
      const actualContextMenu = screen.getByTestId("mock-context-menu");
      expect(actualContextMenu).toBeInTheDocument();
      // AND expect the context menu to have been called with the correct props
      await waitFor(() => {
        expect(ContextMenu).toHaveBeenLastCalledWith(
          {
            anchorEl: actualChosenButton,
            open: true,
            notifyOnClose: expect.any(Function),
            notifyOnExport: expect.any(Function),
          },
          {}
        );
      });
    });

    test("should close the ContextMenu when the context menu's notifyOnClose is called", () => {
      // GIVEN the table is rendered with one model
      const givenModel = getArrayOfRandomModelsMaxLength(1);
      render(<ModelsTable models={givenModel} />);
      // AND the export button is clicked
      const actualButton = screen.getByTestId(DATA_TEST_ID.MODEL_CELL_MORE_BUTTON);
      fireEvent.click(actualButton);
      // AND the context menu of the model is shown
      const actualContextMenu = screen.getByTestId("mock-context-menu");
      expect(actualContextMenu).toBeInTheDocument();

      // WHEN the context menu's notifyOnClose function is called
      act(() => {
        (ContextMenu as jest.Mock).mock.lastCall[0].notifyOnClose();
      });

      // THEN expect the context menu to be closed
      expect(ContextMenu).toHaveBeenLastCalledWith(
        {
          anchorEl: undefined,
          open: false,
          notifyOnClose: expect.any(Function),
          notifyOnExport: expect.any(Function),
        },
        {}
      );
    });

    test("should call the model table's notifyOnExport with the modelId when the context menu's notifyOnExport is called", () => {
      // GIVEN a notifyOnExport function
      const givenNotifyOnExport = jest.fn();
      // AND the table is rendered with some models and the notifyOnExport
      const givenModels = getArrayOfRandomModelsMaxLength(5);
      render(<ModelsTable models={givenModels} notifyOnExport={givenNotifyOnExport} />);

      // WHEN the context menu of one model is clicked
      const actualButtons = screen.queryAllByTestId(DATA_TEST_ID.MODEL_CELL_MORE_BUTTON);
      const actualChosenIndex = 2; // choose and index that is not the first or last to avoid the edge cases
      const actualChosenButton = actualButtons[actualChosenIndex];
      fireEvent.click(actualChosenButton);
      // AND the context menu of that  model is shown
      const actualContextMenu = screen.getByTestId("mock-context-menu");
      expect(actualContextMenu).toBeInTheDocument();
      // AND the context menu's notifyOnExport function is called
      act(() => {
        (ContextMenu as jest.Mock).mock.lastCall[0].notifyOnExport();
      });

      // THEN expect the notifyOnExport function provided to the table to have been called with the modelId of the given model
      expect(givenNotifyOnExport).toHaveBeenCalledWith(givenModels[actualChosenIndex].id);
    });
  });
});
