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
import ImportProcessStateIcon from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import TableLoadingRows from "src/modeldirectory/components/tableLoadingRows/TableLoadingRows";
import { act, fireEvent } from "@testing-library/react";
import ContextMenu from "src/theme/ContextMenu/ContextMenu";
import buildMenuItemsConfig from "./buildMenuItemsConfig";
import { IsOnlineContext } from "src/app/providers";
import { mockLoggedInUser, TestUsers } from "src/_test_utilities/mockLoggedInUser";

function encodeHtmlAttribute(value: string) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

// mock the ImportProcessStateIcon
jest.mock("src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon", () => {
  const actual = jest.requireActual("src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon");
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

// mock the ContextMenu
jest.mock("src/theme/ContextMenu/ContextMenu", () => {
  const actual = jest.requireActual("src/theme/ContextMenu/ContextMenu");
  const mockContextMenu = jest.fn().mockImplementation(() => {
    return <div data-testid="mock-context-menu"></div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockContextMenu,
  };
});

// mock the buildMenuItemsConfig function
jest.mock("./buildMenuItemsConfig", () => {
  const actual = jest.requireActual("./buildMenuItemsConfig");
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

// mock the ExportStateCellContent
jest.mock("src/modeldirectory/components/ModelsTable/ExportStateCellContent/ExportStateCellContent", () => {
  const actual = jest.requireActual(
    "src/modeldirectory/components/ModelsTable/ExportStateCellContent/ExportStateCellContent"
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

// mock the TableLoadingRows
jest.mock("src/modeldirectory/components/tableLoadingRows/TableLoadingRows", () => {
  const actual = jest.requireActual("src/modeldirectory/components/tableLoadingRows/TableLoadingRows");
  const actualModelsTable = jest.requireActual("src/modeldirectory/components/ModelsTable/ModelsTable"); // need this just to be able to access the DATA_TEST_ID.MODELS_LOADER
  const mockTableLoadingBody = jest.fn().mockImplementation(() => {
    return <tr data-testid={actualModelsTable.DATA_TEST_ID.MODELS_LOADER}></tr>;
  });

  return {
    ...actual,
    __esModule: true,
    default: mockTableLoadingBody,
  };
});

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
      // AND a user has model manager role
      mockLoggedInUser({ user: TestUsers.ModelManager });

      // WHEN the ModelsTable is rendered with the given models
      const { container } = render(
        <ModelsTable models={givenModels} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />
      );

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
      ["ModelManager", TestUsers.ModelManager],
      ["RegisteredUser", TestUsers.RegisteredUser],
      ["Anonymous", TestUsers.Anonymous],
    ])("should render the table with the single model and match the snapshot with '%s' role", (_user, testUser) => {
      // GIVEN a single model
      // AND a logged-in user
      mockLoggedInUser({ user: testUser });

      // WHEN the ModelsTable is rendered with the single model  in an array
      render(<ModelsTable models={[fakeModel]} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

      // THEN expect the table to be shown
      const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
      expect(tableElement).toBeInTheDocument();
      // AND the table to match the snapshot
      expect(tableElement).toMatchSnapshot();
    });

    test.each([
      ["empty", []],
      ["null ", null],
      ["undefined", undefined],
    ])("should render an empty table with %s models array", async (_description, givenModels) => {
      // GIVEN an empty model list is provided
      // AND a user has model manager role
      mockLoggedInUser({ user: TestUsers.ModelManager });

      // WHEN the ModelsTable is rendered
      // @ts-ignore
      render(<ModelsTable models={givenModels} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

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
      render(<ModelsTable models={givenModels} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

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
          render(<ModelsTable models={givenModels} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

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
          render(<ModelsTable models={givenModels} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

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

      test("should render the model.importProcessState only when user has model manager role", () => {
        // GIVEN a model with some Import state
        const givenModel = getOneRandomModelMaxLength();
        expect(givenModel.importProcessState).toBeDefined();
        // AND a user has model manager role
        mockLoggedInUser({ user: TestUsers.ModelManager });

        // WHEN the ModelsTable is rendered with the given model
        render(<ModelsTable models={[givenModel]} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

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
        expect(ImportProcessStateIcon).toHaveBeenCalledWith({ importProcessState: givenModel.importProcessState }, {});
      });

      test("should not render the model.importProcessState when a user does not have a model manager role", () => {

        // GIVEN a model with some Import state
        const givenModel = getOneRandomModelMaxLength();
        expect(givenModel.importProcessState).toBeDefined();
        // AND a user has a role which is not "MODEL_MANAGER"
        mockLoggedInUser({ user: TestUsers.RegisteredUser });

        // WHEN the ModelsTable is rendered with the given model
        render(<ModelsTable models={[givenModel]} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

        // THEN expect no errors or warning to have occurred
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();

        // AND expect the icon to not be shown
        const actualModelCellImportStateIconContainer = screen.queryByTestId(
          DATA_TEST_ID.MODEL_CELL_IMPORT_STATE_ICON_CONTAINER
        );
        expect(actualModelCellImportStateIconContainer).not.toBeInTheDocument();
      });

      test("should not render the model.exportProcessState when a user has an anonymous role", () => {
        // GIVEN a model with some Export state
        const givenModel = getOneRandomModelMaxLength();
        expect(givenModel.exportProcessState).toBeDefined();
        // AND a user has an anonymous role
        mockLoggedInUser({ user: TestUsers.Anonymous });

        // WHEN the ModelsTable is rendered with the given model
        render(<ModelsTable models={[givenModel]} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

        // THEN expect no errors or warning to have occurred
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();

        // AND expect the icon to not be shown
        const actualModelCellExportStateContainer = screen.queryByTestId(DATA_TEST_ID.MODEL_CELL_EXPORT_STATE_CONTAINER);
        expect(actualModelCellExportStateContainer).not.toBeInTheDocument();
      });
    });

    describe("should render the table with the loader component when the loading property is set to true", () => {
      test("should render the table with the loader component when the loading property is set to true", () => {
        // GIVEN isLoading property is true
        const givenIsLoading = true;
        // AND a user has model manager role
        mockLoggedInUser({ user: TestUsers.ModelManager });
        // AND an empty models list is provided

        // WHEN the ModelsTable component is rendered with the given properties
        render(
          <ModelsTable
            models={[]}
            isLoading={givenIsLoading}
            notifyOnExport={jest.fn()}
            notifyOnShowModelDetails={jest.fn}
          />
        );

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

        // AND the table to match the snapshot
        expect(tableElement).toMatchSnapshot();
      });

      test("should render the table without the loader component when the loading property is false", () => {
        // GIVEN the loading property is false
        const givenIsLoading = false;
        // AND n models are provided
        const givenModels: ModelInfoTypes.ModelInfo[] = getArrayOfRandomModelsMaxLength(3);

        // WHEN the ModelsTable component is rendered with the given properties
        render(
          <ModelsTable
            models={givenModels}
            isLoading={givenIsLoading}
            notifyOnExport={jest.fn()}
            notifyOnShowModelDetails={jest.fn}
          />
        );

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
        render(<ModelsTable models={givenModels} notifyOnExport={jest.fn()} notifyOnShowModelDetails={jest.fn} />);

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

    test("should render the context menu with the initial state", () => {
      // GIVEN n models are provided
      const givenModels = getArrayOfRandomModelsMaxLength(3);
      // AND a function notifyOnExport will be passed to the ModelsTable
      const mockNotifyOnExport = jest.fn();
      const mockNotifyOnShowModelDetails = jest.fn();

      // WHEN the ModelsTable component is rendered with the given models
      render(
        <ModelsTable
          models={givenModels}
          notifyOnExport={mockNotifyOnExport}
          notifyOnShowModelDetails={mockNotifyOnShowModelDetails}
        />
      );

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the function "buildMenuItemsConfig" to have been called with the given models

      // AND the context menu to be called with the correct initial props
      expect(ContextMenu).toHaveBeenCalledWith(
        {
          anchorEl: null,
          open: false,
          notifyOnClose: expect.any(Function),
          items: [],
        },
        {}
      );
      // AND the function "buildMenuItemsConfig" to not have been called
      expect(buildMenuItemsConfig).not.toHaveBeenCalled();
    });
  });

  describe("action tests", () => {
    test.each([true, false])(
      "should display the ContextMenu with the correct props when the 'more' button is clicked when isOnline:%s",
      async (givenIsOnline) => {
        // GIVEN N models to be shown in the table
        const givenModels = getArrayOfRandomModelsMaxLength(5);
        // AND a notifyOnExport callback function
        const mockNotifyOnExport = jest.fn();
        // AND a notifyOnShowModelDetails callback function
        const mockNotifyOnShowModelDetails = jest.fn();
        // AND a hasRole function
        const mockHasRole = jest.fn().mockReturnValue(true);
        // AND a logged-in user
        mockLoggedInUser({ hasRole: mockHasRole });
        // AND the function "buildMenuItemsConfig" will return some items
        const givenMenuItems = [
          {
            id: "some-id",
            text: "some-text",
            icon: <div />,
            action: jest.fn(),
            disabled: false,
          },
        ];
        (buildMenuItemsConfig as jest.Mock).mockReturnValue(givenMenuItems);
        // AND the isOnline context is set
        jest.spyOn(React, "useContext").mockImplementation((ctx: React.Context<unknown>) => {
          const actual = jest.requireActual("react");
          if (ctx === IsOnlineContext) {
            return givenIsOnline;
          }
          return actual.useContext(ctx);
        });
        // AND the ModelsTable is rendered with:
        // - the given models,
        // - the notifyOnExport function and
        // - the notifyOnShowModelDetails function
        render(
          <ModelsTable
            models={givenModels}
            notifyOnExport={mockNotifyOnExport}
            notifyOnShowModelDetails={mockNotifyOnShowModelDetails}
          />
        );

        // WHEN the more button is clicked for a model
        for (const model of givenModels) {
          const index = givenModels.indexOf(model);
          const actualMoreButton = screen.getAllByTestId(DATA_TEST_ID.MODEL_CELL_MORE_BUTTON)[index];
          fireEvent.click(actualMoreButton);

          // THEN expect the context menu to be shown
          const actualContextMenu = screen.getByTestId("mock-context-menu");
          expect(actualContextMenu).toBeInTheDocument();
          // AND the function "buildMenuItemsConfig" to have been called with:
          // - the current model,
          // - the given notifyOnExport function
          // - the given handleShowModelDetails
          // - and isOnline context
          expect(buildMenuItemsConfig).toHaveBeenCalledWith(
            model,
            { handleExport: mockNotifyOnExport, handleShowModelDetails: mockNotifyOnShowModelDetails },
            givenIsOnline,
            mockHasRole
          );
          // AND the contextMenu to be called with:
          // - the given items returned by the "buildMenuItemsConfig" function,
          // - the actual MoreButton as an anchorEl and
          // - open = true
          expect(ContextMenu).toHaveBeenCalledWith(
            {
              anchorEl: actualMoreButton,
              open: true,
              notifyOnClose: expect.any(Function),
              items: givenMenuItems,
            },
            {}
          );
        }
      }
    );

    test("should close the menu when notifyOnClose is called", () => {
      // GIVEN that the ModelsTable is shown with N models
      const givenModels = getArrayOfRandomModelsMaxLength(1);
      // AND a function notifyOnExport will be passed to the ModelsTable
      const mockNotifyOnExport = jest.fn();
      render(
        <ModelsTable models={givenModels} notifyOnExport={mockNotifyOnExport} notifyOnShowModelDetails={jest.fn} />
      );
      // AND the more button is clicked to open the context menu
      const actualMoreButton = screen.getAllByTestId(DATA_TEST_ID.MODEL_CELL_MORE_BUTTON)[0];
      fireEvent.click(actualMoreButton);

      // WHEN the notifyOnClose is called
      act(() => {
        const mock = (ContextMenu as jest.Mock).mock;
        mock.lastCall[0].notifyOnClose();
      });

      // THEN expect the context menu to be closed
      expect(ContextMenu).toHaveBeenCalledWith(
        {
          anchorEl: null,
          open: false,
          notifyOnClose: expect.any(Function),
          items: [],
        },
        {}
      );
    });
  });
});
