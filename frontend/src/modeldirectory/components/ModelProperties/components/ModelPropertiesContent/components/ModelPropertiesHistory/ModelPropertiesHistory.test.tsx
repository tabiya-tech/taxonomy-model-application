// mute the console
import "src/_test_utilities/consoleMock";

import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "src/_test_utilities/test-utils";
import ModelPropertiesHistory, {
  DATA_TEST_ID,
  FIELD_ID,
  FIELD_LABEL_TEXT,
  HELP_TIP_TEXT,
} from "./ModelPropertiesHistory";
import FormattedDatePropertyField from "src/theme/PropertyFieldLayout/FormattedDatePropertyField/FormattedDatePropertyField";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";
import { DATA_TEST_ID as UUIDHistoryTimelineDataTestId } from "./UUIDHistoryTimeline/ModelHistoryTimeline";
import * as React from "react";
import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

//mock the TextPropertyField component
jest.mock("src/theme/PropertyFieldLayout/FormattedDatePropertyField/FormattedDatePropertyField", () => {
  const mockFormattedDatePropertyField = jest
    .fn()
    .mockImplementation((props: { "data-testid": string; label: string }) => {
      return (
        <div data-testid={props["data-testid"]}>
          Mock FormattedDatePropertyField
          {/* rendering the label so that it becomes part of the snapshot ,so that
          changes in the label values can be detected*/}
          <span>label:{props.label}</span>
        </div>
      );
    });
  return {
    __esModule: true,
    default: mockFormattedDatePropertyField,
  };
});

//mock the ModelHistoryTimeline component
jest.mock("./UUIDHistoryTimeline/ModelHistoryTimeline", () => {
  const actual = jest.requireActual("./UUIDHistoryTimeline/ModelHistoryTimeline");
  return {
    __esModule: true,
    ...actual,
    default: jest.fn().mockImplementation(() => {
      return <div data-testid={actual.DATA_TEST_ID.UUID_HISTORY_TIMELINE}>Mock UUIDHistoryTimeline</div>;
    }),
  };
});

// mock the propertyFieldLayout component
jest.mock("src/theme/PropertyFieldLayout/PropertyFieldLayout", () => {
  return jest.fn().mockImplementation(({ children }) => <div>{children}</div>);
});

describe("ModelPropertiesHistory", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  test("should render correctly with the provided model props", () => {
    // GIVEN a model
    const givenModel = fakeModel;
    // guard that the created and updated dates are different to avoid false positives
    expect(givenModel.createdAt).not.toEqual(givenModel.updatedAt);

    // WHEN the ModelPropertiesHistory is rendered with the given model
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
    // AND it was called with the createdAt property and the correct label
    expect(FormattedDatePropertyField).toHaveBeenCalledWith(
      {
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_CREATED_DATE,
        date: givenModel.createdAt,
        label: FIELD_LABEL_TEXT.CREATION_DATE,
        fieldId: expect.any(String),
      },
      {}
    );
    // AND updated date property to be shown
    const actualUpdatedDate = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_UPDATED_DATE);
    expect(actualUpdatedDate).toBeInTheDocument();
    // AND it was called with the updatedAt property and the correct label
    expect(FormattedDatePropertyField).toHaveBeenCalledWith(
      {
        "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_UPDATED_DATE,
        date: givenModel.updatedAt,
        label: FIELD_LABEL_TEXT.LAST_UPDATE,
        fieldId: expect.any(String),
      },
      {}
    );
    // AND the PropertyFieldLayout to be called with the correct props
    expect(PropertyFieldLayout).toHaveBeenCalledWith(
      {
        title: "Model History",
        helpTipMessage: HELP_TIP_TEXT.MODEL_HISTORY,
        fieldId: FIELD_ID.UUID_HISTORY_FIELD,
        children: expect.anything(),
      },
      {}
    );
    // AND the ModelHistoryTimeline to be shown
    const actualUUIDHistoryTimeline = screen.getByTestId(UUIDHistoryTimelineDataTestId.UUID_HISTORY_TIMELINE);
    expect(actualUUIDHistoryTimeline).toBeInTheDocument();
    // AND it was called with the model's modelHistory property
    expect(require("./UUIDHistoryTimeline/ModelHistoryTimeline").default).toHaveBeenCalledWith(
      {
        UUIDHistoryDetails: givenModel.modelHistory,
      },
      {}
    );

    // AND to match the snapshot
    expect(modelPropertiesHistoryContainer).toMatchSnapshot();
  });

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "ModelPropertiesHistory",
      Component: <ModelPropertiesHistory model={fakeModel} />,
      roles: ALL_USERS,
      testIds: [
        DATA_TEST_ID.MODEL_PROPERTIES_HISTORY_CONTAINER,
        DATA_TEST_ID.MODEL_PROPERTIES_CREATED_DATE,
        DATA_TEST_ID.MODEL_PROPERTIES_UPDATED_DATE,
        UUIDHistoryTimelineDataTestId.UUID_HISTORY_TIMELINE,
      ],
    })
  );
});
