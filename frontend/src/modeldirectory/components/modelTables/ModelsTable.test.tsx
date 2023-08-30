import {render, screen, within} from "@testing-library/react";
import ModelsTable, {DATA_TEST_ID, TEXT} from "./ModelsTable";
import {getRandomModels} from "./_test_utilities/mockModelData";

function encodeHtmlAttribute(value: string) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

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
  })
})