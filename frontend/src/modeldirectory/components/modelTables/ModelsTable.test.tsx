import {render, screen, within} from "@testing-library/react";
import ModelsTable, {DATA_TEST_ID, TEXT} from "./ModelsTable";
import {getRandomModels} from "./_test_utilities/mockModelData";
import {ModelDirectoryTypes} from "../../modelDirectory.types";

function encodeHtmlAttribute(value: string) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

// mock the TableLoadingRows
jest.mock('src/modeldirectory/components/tableLoadingRows/TableLoadingRows', () => {
  const actual = jest.requireActual('src/modeldirectory/components/tableLoadingRows/TableLoadingRows');
  const actualModelsTable = jest.requireActual('src/modeldirectory/components/modelTables/ModelsTable')
  const mockTableLoadingBody = jest.fn().mockImplementation(() => {
    return <tr data-testid={actualModelsTable.DATA_TEST_ID.MODELS_LOADER}></tr>
  });
  
  return {
    ...actual, __esModule: true, default: mockTableLoadingBody
  }
})

describe("ModelsTable", () => {
  test("should render the table with the models", () => {
    // GIVEN n models
    const givenModels = getRandomModels(3);

    // WHEN the ModelsTable is rendered with the given models
    const {container} = render(<ModelsTable models={givenModels}/>);

    // THEN expect the table to be shown
    const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
    expect(tableElement).toBeInTheDocument();

    // AND the table to have a header row
    const actualModelTableHeaderRow = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
    expect(actualModelTableHeaderRow).toBeInTheDocument();
    const actualHeaderCells = within(actualModelTableHeaderRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);

    // AND the NAME header cell to be shown
    const actualModelNameHeaderIndex = actualHeaderCells.findIndex(headerCell => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_NAME);
    expect(actualModelNameHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelNameHeaderCell = actualHeaderCells[actualModelNameHeaderIndex];
    expect(actualModelNameHeaderCell).toBeInTheDocument();

    // AND the LOCALE header cell to be shown
    const actualModelLocaleNameHeaderIndex = actualHeaderCells.findIndex(headerCell => headerCell.textContent === TEXT.TABLE_HEADER_LABEL_LOCALE);
    expect(actualModelLocaleNameHeaderIndex).toBeGreaterThanOrEqual(0);
    const actualModelLocaleNameHeaderCell = actualHeaderCells[actualModelLocaleNameHeaderIndex];
    expect(actualModelLocaleNameHeaderCell).toBeInTheDocument();

    // AND all models to be in the table
    const modelTableRows = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
    expect(modelTableRows.length).toEqual(givenModels.length);

    // AND each model to be correctly shown in a row
    givenModels.forEach(model => {
      // the given model row to be in the table
      // eslint-disable-next-line testing-library/no-node-access,testing-library/no-container
      const actualModelRow = container.querySelector(`[data-modelid="${encodeHtmlAttribute(model.id)}"]`) as HTMLElement;
      expect(actualModelRow).toBeInTheDocument();

      const actualModelCells = within(actualModelRow).getAllByTestId(DATA_TEST_ID.MODEL_CELL);
      // AND the model's NAME to be shown in the correct column
      expect(actualModelCells[actualModelNameHeaderIndex]).toHaveTextContent(model.name);

      // AND the model's LOCALE to be shown in the correct column
      expect(actualModelCells[actualModelLocaleNameHeaderIndex]).toHaveTextContent(model.locale.name);
    })
  });

  test.each([
    ["empty", []],
    ["null ", null],
    ["undefined", undefined],
  ])("should render an empty table with %s models array", async (description, givenModels) => {
    // GIVEN an empty model list is provided

    // WHEN the ModelsTable is rendered
    // @ts-ignore
    render(<ModelsTable models={givenModels}/>);

    // THEN expect the table to be shown
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
    // AND the table should not have any row
    const modelTableRows = screen.queryAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
    expect(modelTableRows).toHaveLength(0);
  });
  
  test("should render the table with the loader component when the loading property is set to true", () => {
    // GIVEN  isLoading property is true
    const givenIsLoading = true;
    // AND an empty models list is provided
    const givenModels : ModelDirectoryTypes.ModelInfo[] = [];
    
    // WHEN the ModelsTable component is rendered with the given properties
    render(<ModelsTable models={givenModels} isLoading={givenIsLoading} />)
    
    // THEN expect the table to be shown
    const tableElement = screen.getByTestId(DATA_TEST_ID.MODELS_TABLE_ID);
    expect(tableElement).toBeInTheDocument();
    // AND the table to have a header row
    const actualModelTableHeaderRow = screen.getByTestId(DATA_TEST_ID.MODEL_TABLE_HEADER_ROW);
    expect(actualModelTableHeaderRow).toBeInTheDocument();
    // AND the loader component to be shown
    const modelsLoaderElement = screen.getByTestId(DATA_TEST_ID.MODELS_LOADER);
    expect(modelsLoaderElement).toBeInTheDocument();
    // AND no model should be shown
    const modelTableDataRowElement = screen.queryByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
    expect(modelTableDataRowElement).not.toBeInTheDocument();
  });
  
  test("should render the table without the loader component when the loading property is false", () => {
    // GIVEN the loading property is false
    const givenIsLoading = false;
    // AND n models are provided
    const givenModels : ModelDirectoryTypes.ModelInfo[] = getRandomModels(3);
    
    // WHEN the ModelsTable component is rendered with the given properties
    render(<ModelsTable models={givenModels} isLoading={givenIsLoading} />);
    
    // THEN expect the table to be shown
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
  
  test("should not render the loader component when the table contains some models", () =>{
    // GIVEN n models are provided
    const givenModels = getRandomModels(3);
    
    // WHEN the ModelsTable component is rendered with the given models
    render(<ModelsTable models={givenModels} />);
    
    // THEN expect the given models to be shown
    const modelTableDataRowElements = screen.getAllByTestId(DATA_TEST_ID.MODEL_TABLE_DATA_ROW);
    expect(modelTableDataRowElements).toHaveLength(givenModels.length);
    // AND the loader component to not be shown
    const modelsLoaderElement = screen.queryByTestId(DATA_TEST_ID.MODELS_LOADER);
    expect(modelsLoaderElement).not.toBeInTheDocument();
  });
});