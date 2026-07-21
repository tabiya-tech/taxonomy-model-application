// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ModelsCardList, { DATA_TEST_ID, TEXT, filterVisibleModels } from "./ModelsCardList";
import ModelCard from "./components/ModelCard/ModelCard";
import {
  getMockUUID,
  getOneDeterministicFakeModel,
  getOneFakeSuccessfulExportProcessState,
} from "src/modeldirectory/_test_utilities/mockModelData";
import { mockLoggedInUser, TestUsers } from "src/_test_utilities/mockLoggedInUser";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

// mock the ModelCard component, but keep the real named exports (e.g. BASE_LOCALE_NAME)
jest.mock("./components/ModelCard/ModelCard", () => {
  const actual = jest.requireActual("./components/ModelCard/ModelCard");
  const mock = jest.fn(() => {
    return <div data-testid={"mock-ModelCard"} />;
  });
  return {
    ...actual,
    __esModule: true,
    default: mock,
  };
});

function getLocale(seed: number): ModelInfoTypes.Locale {
  return {
    UUID: getMockUUID(5000 + seed),
    name: `Locale ${seed}`,
    shortCode: `L${seed}`,
  };
}

describe("ModelsCardList", () => {
  const notifyOnExport = jest.fn();
  const notifyOnShowModelDetails = jest.fn();
  const notifyOnExplore = jest.fn();
  const notifyOnRelease = jest.fn();

  function renderModelsCardList(models: ModelInfoTypes.ModelInfo[], isLoading: boolean = false) {
    render(
      <ModelsCardList
        models={models}
        isLoading={isLoading}
        notifyOnExport={notifyOnExport}
        notifyOnShowModelDetails={notifyOnShowModelDetails}
        notifyOnExplore={notifyOnExplore}
        notifyOnRelease={notifyOnRelease}
      />
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render one card per locale with the correct props", () => {
    // GIVEN an anonymous user
    mockLoggedInUser({ user: TestUsers.Anonymous });
    // AND three downloadable models in two locales
    const givenLocaleA = getLocale(1);
    const givenLocaleB = getLocale(2);
    const givenModels = [
      getOneDeterministicFakeModel(1, { locale: givenLocaleA, createdAt: new Date("2023-03-01T00:00:00.000Z") }),
      getOneDeterministicFakeModel(2, { locale: givenLocaleB, createdAt: new Date("2023-02-01T00:00:00.000Z") }),
      getOneDeterministicFakeModel(3, { locale: givenLocaleA, createdAt: new Date("2023-01-01T00:00:00.000Z") }),
    ];

    // WHEN the component is rendered
    renderModelsCardList(givenModels);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND expect the list to be shown
    const actualList = screen.getByTestId(DATA_TEST_ID.MODELS_CARD_LIST);
    expect(actualList).toBeInTheDocument();

    // AND one card per locale to be rendered
    expect(screen.getAllByTestId("mock-ModelCard")).toHaveLength(2);

    // AND the cards to have been called with the correct groups and callbacks
    const actualCalls = (ModelCard as jest.Mock).mock.calls;
    // the group of locale A contains the most recently created model, so it comes first
    expect(actualCalls[0][0].group.locale).toEqual(givenLocaleA);
    expect(actualCalls[0][0].group.models).toEqual([givenModels[0], givenModels[2]]);
    expect(actualCalls[1][0].group.locale).toEqual(givenLocaleB);
    expect(actualCalls[1][0].group.models).toEqual([givenModels[1]]);
    actualCalls.forEach(([actualProps]: [any]) => {
      expect(actualProps.isModelManager).toBe(false);
      expect(actualProps.notifyOnExport).toBe(notifyOnExport);
      expect(actualProps.notifyOnShowModelDetails).toBe(notifyOnShowModelDetails);
      expect(actualProps.notifyOnExplore).toBe(notifyOnExplore);
      expect(actualProps.notifyOnRelease).toBe(notifyOnRelease);
    });

    // AND the list to match the snapshot
    expect(actualList).toMatchSnapshot();
  });

  test("should render the loading skeletons when loading", () => {
    // GIVEN the list is loading
    // WHEN the component is rendered
    renderModelsCardList([], true);

    // THEN expect the loading skeletons to be shown
    expect(screen.getAllByTestId(DATA_TEST_ID.MODELS_LOADER).length).toBeGreaterThan(0);
    // AND no cards or empty message
    expect(screen.queryByTestId("mock-ModelCard")).not.toBeInTheDocument();
    expect(screen.queryByTestId(DATA_TEST_ID.MODELS_EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  test("should render the empty message when there are no models", () => {
    // GIVEN no models
    // WHEN the component is rendered
    renderModelsCardList([]);

    // THEN expect the empty message to be shown
    expect(screen.getByTestId(DATA_TEST_ID.MODELS_EMPTY_MESSAGE)).toHaveTextContent(TEXT.EMPTY_MESSAGE);
    // AND no cards
    expect(screen.queryByTestId("mock-ModelCard")).not.toBeInTheDocument();
  });

  test("should hide models without a successful export from a user that is not a model manager", () => {
    // GIVEN a registered user that is not a model manager
    mockLoggedInUser({ user: TestUsers.RegisteredUser });
    // AND a downloadable model and a model that was never exported, in different locales
    const givenDownloadableModel = getOneDeterministicFakeModel(1, { locale: getLocale(1) });
    const givenNonDownloadableModel = getOneDeterministicFakeModel(2, {
      locale: getLocale(2),
      exportProcessState: [],
    });

    // WHEN the component is rendered
    renderModelsCardList([givenDownloadableModel, givenNonDownloadableModel]);

    // THEN expect only the card of the downloadable model to be rendered
    expect(screen.getAllByTestId("mock-ModelCard")).toHaveLength(1);
    expect((ModelCard as jest.Mock).mock.calls[0][0].group.models).toEqual([givenDownloadableModel]);
  });

  test("should show the base taxonomy (locale 'Europe') first even when other models are newer", () => {
    // GIVEN a newer model in another locale and an older model of the base locale "Europe"
    const givenNewerModel = getOneDeterministicFakeModel(1, {
      locale: getLocale(1),
      createdAt: new Date("2023-03-01T00:00:00.000Z"),
    });
    const givenBaseModel = getOneDeterministicFakeModel(2, {
      locale: { UUID: getMockUUID(5999), name: "Europe", shortCode: "EU" },
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
    });

    // WHEN the component is rendered
    renderModelsCardList([givenNewerModel, givenBaseModel]);

    // THEN expect the base taxonomy card to come first
    const actualCalls = (ModelCard as jest.Mock).mock.calls;
    expect(actualCalls[0][0].group.locale.name).toBe("Europe");
    expect(actualCalls[1][0].group.locale.name).toBe(givenNewerModel.locale.name);
  });

  test("should show all models to a model manager", () => {
    // GIVEN a model manager
    mockLoggedInUser({ user: TestUsers.ModelManager });
    // AND a downloadable model and a model that was never exported, in different locales
    const givenDownloadableModel = getOneDeterministicFakeModel(1, { locale: getLocale(1) });
    const givenNonDownloadableModel = getOneDeterministicFakeModel(2, {
      locale: getLocale(2),
      exportProcessState: [],
    });

    // WHEN the component is rendered
    renderModelsCardList([givenDownloadableModel, givenNonDownloadableModel]);

    // THEN expect both cards to be rendered
    expect(screen.getAllByTestId("mock-ModelCard")).toHaveLength(2);
    // AND the cards to know that the user is a model manager
    (ModelCard as jest.Mock).mock.calls.forEach(([actualProps]: [any]) => {
      expect(actualProps.isModelManager).toBe(true);
    });
  });
});

describe("filterVisibleModels", () => {
  test("should return all models for a model manager", () => {
    // GIVEN a downloadable and a non-downloadable model
    const givenDownloadableModel = getOneDeterministicFakeModel(1);
    const givenNonDownloadableModel = getOneDeterministicFakeModel(2, { exportProcessState: [] });

    // WHEN filterVisibleModels is called for a model manager
    const actual = filterVisibleModels([givenDownloadableModel, givenNonDownloadableModel], true);

    // THEN expect all models to be returned
    expect(actual).toEqual([givenDownloadableModel, givenNonDownloadableModel]);
  });

  test("should return only downloadable models for a user that is not a model manager", () => {
    // GIVEN a downloadable and a non-downloadable model
    const givenDownloadableModel = getOneDeterministicFakeModel(1);
    const givenNonDownloadableModel = getOneDeterministicFakeModel(2, { exportProcessState: [] });

    // WHEN filterVisibleModels is called for a user that is not a model manager
    const actual = filterVisibleModels([givenDownloadableModel, givenNonDownloadableModel], false);

    // THEN expect only the downloadable model to be returned
    expect(actual).toEqual([givenDownloadableModel]);
  });

  test("should keep a model whose export completed with warnings visible to a user that is not a model manager", () => {
    // GIVEN a model whose only export completed with warnings (but no errors),
    // such a model is still exported and consistent, so it can be downloaded
    const givenExport = getOneFakeSuccessfulExportProcessState(1);
    givenExport.result.exportWarnings = true;
    const givenModelWithWarnings = getOneDeterministicFakeModel(1, { exportProcessState: [givenExport] });

    // WHEN filterVisibleModels is called for a user that is not a model manager
    const actual = filterVisibleModels([givenModelWithWarnings], false);

    // THEN expect the model to be visible
    expect(actual).toEqual([givenModelWithWarnings]);
  });
});
