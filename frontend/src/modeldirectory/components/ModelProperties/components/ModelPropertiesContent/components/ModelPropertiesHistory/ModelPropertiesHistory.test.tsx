// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesHistory, { DATA_TEST_ID } from "./ModelPropertiesHistory";

//mock the ModelPropertiesItemDetails component
jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesItemDetails/ModelPropertiesItemDetails",
  () => {
    return function ItemDetailsMock(props: { title: string; value: string; "data-testid": string }) {
      return (
        <div data-testid={props["data-testid"]}>
          <span>{props.title}</span>
          <span>{props.value}</span>
        </div>
      );
    };
  }
);

describe("ModelPropertiesHistory", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  test("should render correctly with the provided model props", () => {
    // GIVEN a model
    const givenModel = fakeModel;

    // WHEN the ModelPropertiesHistory is rendered with the given model
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () =>
        ({
          format: () => "Sat, Jun 28, 1914, 10:45 AM GMT+1",
        }) as unknown as Intl.DateTimeFormat
    );
    render(<ModelPropertiesHistory model={givenModel} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be shown
    const modelPropertiesHistoryContainer = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_HISTORY_CONTAINER);
    expect(modelPropertiesHistoryContainer).toBeInTheDocument();
    // AND created date property to be shown
    const actualCreatedDate = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_CREATED_DATE);
    expect(actualCreatedDate).toBeInTheDocument();
    // AND updated date property to be shown
    const actualUpdatedDate = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_UPDATED_DATE);
    expect(actualUpdatedDate).toBeInTheDocument();
    // AND to match the snapshot
    expect(modelPropertiesHistoryContainer).toMatchSnapshot();
  });
});
