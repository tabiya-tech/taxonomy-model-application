// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import ModelCard, {
  DATA_TEST_ID,
  getCardSubtitle,
  getCardTitle,
  getDescriptionStyle,
  getVersionsCountText,
  LOCALE_DISPLAY_OVERRIDES,
} from "./ModelCard";
import VersionRow from "../VersionRow/VersionRow";
import { groupModelsByLocale, TaxonomyGroup } from "src/modeldirectory/components/ModelsCardList/groupModelsByLocale";
import { getMockUUID, getOneDeterministicFakeModel } from "src/modeldirectory/_test_utilities/mockModelData";

// mock the VersionRow component
jest.mock("../VersionRow/VersionRow", () => {
  const mock = jest.fn(() => {
    return <div data-testid={"mock-VersionRow"} />;
  });
  return {
    __esModule: true,
    default: mock,
  };
});

// mock the ImportProcessStateIcon component
jest.mock("src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon", () => {
  const mock = jest.fn(() => {
    return <div data-testid={"mock-ImportProcessState-icon"} />;
  });
  return {
    __esModule: true,
    default: mock,
  };
});

// mock MarkdownPropertyField component
jest.mock("src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField", () => {
  const mockMarkdownPropertyField = jest.fn().mockImplementation((props) => {
    return <span data-testid="mock-markdown-property-field">{props.text}</span>;
  });

  return {
    __esModule: true,
    default: mockMarkdownPropertyField,
  };
});

function getTestGroup(): TaxonomyGroup {
  const locale = {
    UUID: getMockUUID(5001),
    name: "South Africa",
    shortCode: "ZA",
  };
  const models = [
    getOneDeterministicFakeModel(1, { locale, createdAt: new Date("2023-03-01T00:00:00.000Z") }),
    getOneDeterministicFakeModel(2, { locale, createdAt: new Date("2023-02-01T00:00:00.000Z") }),
    getOneDeterministicFakeModel(3, { locale, createdAt: new Date("2023-01-01T00:00:00.000Z") }),
  ];
  return groupModelsByLocale(models)[0];
}

describe("ModelCard", () => {
  const notifyOnExport = jest.fn();
  const notifyOnShowModelDetails = jest.fn();
  const notifyOnExplore = jest.fn();
  const notifyOnRelease = jest.fn();

  function renderModelCard(group: TaxonomyGroup = getTestGroup(), isModelManager: boolean = false) {
    render(
      <ModelCard
        group={group}
        isModelManager={isModelManager}
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

  test("should render the collapsed card with the model summary", () => {
    // GIVEN a group with three versions
    const givenGroup = getTestGroup();

    // WHEN the component is rendered
    renderModelCard(givenGroup);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND expect the card to be shown
    const actualCard = screen.getByTestId(DATA_TEST_ID.MODEL_CARD);
    expect(actualCard).toBeInTheDocument();

    // AND the card to be collapsed
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_CARD_SUMMARY)).toHaveAttribute("aria-expanded", "false");

    // AND the status icon of the latest model to be shown
    expect(screen.getByTestId("mock-ImportProcessState-icon")).toBeInTheDocument();

    // AND the title to be the locale name
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_CARD_TITLE)).toHaveTextContent(givenGroup.locale.name);

    // AND the subtitle to be shown
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_CARD_SUBTITLE)).toHaveTextContent(getCardSubtitle(givenGroup));

    // AND the description of the latest model to be shown
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_CARD_DESCRIPTION)).toHaveTextContent(
      givenGroup.latestModel.description
    );

    // AND the number of versions to be shown
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_CARD_VERSIONS_COUNT)).toHaveTextContent("3 versions");

    // AND the card to match the snapshot
    expect(actualCard).toMatchSnapshot();
  });

  test("should render one version row per model with the correct props", () => {
    // GIVEN a group with three versions
    const givenGroup = getTestGroup();

    // WHEN the component is rendered for a model manager
    renderModelCard(givenGroup, true);

    // THEN expect one version row per model
    expect(screen.getAllByTestId("mock-VersionRow")).toHaveLength(givenGroup.models.length);

    // AND each row to have been called with the correct model
    const expectedLatestModel = givenGroup.models.find((model) => model.released);
    givenGroup.models.forEach((model, index) => {
      expect(VersionRow as jest.Mock).toHaveBeenNthCalledWith(
        index + 1,
        {
          model: model,
          isLatest: model.id === expectedLatestModel?.id,
          isModelManager: true,
          notifyOnExport: notifyOnExport,
          notifyOnShowModelDetails: notifyOnShowModelDetails,
          notifyOnExplore: notifyOnExplore,
          notifyOnRelease: notifyOnRelease,
        },
        {}
      );
    });

    // AND exactly one row to be the latest
    const actualCalls = (VersionRow as jest.Mock).mock.calls;
    expect(actualCalls.filter(([props]) => props.isLatest)).toHaveLength(1);
  });

  test("should mark the newest released model as the latest, never a release candidate", () => {
    // GIVEN a group whose newest model is unreleased (a release candidate)
    const locale = { UUID: getMockUUID(5001), name: "South Africa", shortCode: "ZA" };
    const givenReleaseCandidate = getOneDeterministicFakeModel(1, {
      locale,
      released: false,
      createdAt: new Date("2023-03-01T00:00:00.000Z"),
    });
    const givenNewestReleased = getOneDeterministicFakeModel(2, {
      locale,
      released: true,
      createdAt: new Date("2023-02-01T00:00:00.000Z"),
    });
    const givenOlderReleased = getOneDeterministicFakeModel(3, {
      locale,
      released: true,
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
    });
    const givenGroup = groupModelsByLocale([givenReleaseCandidate, givenNewestReleased, givenOlderReleased])[0];

    // WHEN the component is rendered
    renderModelCard(givenGroup);

    // THEN expect the newest *released* model to be the latest, and the release candidate not to be
    const actualCalls = (VersionRow as jest.Mock).mock.calls;
    const actualLatestIds = actualCalls.filter(([p]) => p.isLatest).map(([p]) => p.model.id);
    expect(actualLatestIds).toEqual([givenNewestReleased.id]);
  });

  test("should expand and collapse the card when the summary is clicked", async () => {
    // GIVEN a rendered collapsed card
    renderModelCard();
    const actualSummary = screen.getByTestId(DATA_TEST_ID.MODEL_CARD_SUMMARY);
    expect(actualSummary).toHaveAttribute("aria-expanded", "false");

    // WHEN the summary is clicked
    await userEvent.click(actualSummary);

    // THEN expect the card to be expanded
    expect(actualSummary).toHaveAttribute("aria-expanded", "true");

    // WHEN the summary is clicked again
    await userEvent.click(actualSummary);

    // THEN expect the card to be collapsed again
    expect(actualSummary).toHaveAttribute("aria-expanded", "false");
  });

  test("should expand the card with the keyboard", async () => {
    // GIVEN a rendered collapsed card
    renderModelCard();
    const actualSummary = screen.getByTestId(DATA_TEST_ID.MODEL_CARD_SUMMARY);

    // WHEN the summary is focused and Enter is pressed
    actualSummary.focus();
    await userEvent.keyboard("{Enter}");

    // THEN expect the card to be expanded
    expect(actualSummary).toHaveAttribute("aria-expanded", "true");
  });

  test.each([
    [1, "1 version"],
    [2, "2 versions"],
  ])("getVersionsCountText should return the correct text for %s", (givenCount, expectedText) => {
    // GIVEN a count
    // WHEN getVersionsCountText is called
    // THEN expect the correct text
    expect(getVersionsCountText(givenCount)).toBe(expectedText);
  });

  describe("getCardTitle and getCardSubtitle", () => {
    test("should return the locale name and the model name when there is only one version", () => {
      // GIVEN a group with a single version and no display override
      const locale = { UUID: getMockUUID(5001), name: "South Africa", shortCode: "ZA" };
      const givenGroup = groupModelsByLocale([getOneDeterministicFakeModel(1, { locale })])[0];

      // WHEN getCardTitle/getCardSubtitle is called
      // THEN expect the locale name as title and the model name as subtitle (since only 1 version)
      expect(getCardTitle(givenGroup)).toBe(givenGroup.locale.name);
      expect(getCardSubtitle(givenGroup)).toBe(givenGroup.latestModel.name);
    });

    test("should return the localization subtitle when there are multiple versions", () => {
      // GIVEN a group with multiple versions
      const locale = { UUID: getMockUUID(5001), name: "South Africa", shortCode: "ZA" };
      const givenGroup = groupModelsByLocale([
        getOneDeterministicFakeModel(1, { locale, createdAt: new Date("2023-02-01") }),
        getOneDeterministicFakeModel(2, { locale, createdAt: new Date("2023-01-01") }),
      ])[0];

      // WHEN getCardSubtitle is called
      // THEN expect a localization subtitle using the locale name
      expect(getCardSubtitle(givenGroup)).toBe(`Localized for the ${locale.name} labour market`);
    });

    test("should return the display overrides for the locale 'Europe'", () => {
      // GIVEN a group with the locale "Europe"
      const givenGroup = getTestGroup();
      givenGroup.locale = { ...givenGroup.locale, name: "Europe" };

      // WHEN getCardTitle/getCardSubtitle is called
      // THEN expect the display overrides
      expect(getCardTitle(givenGroup)).toBe("Tabiya ESCO");
      expect(getCardSubtitle(givenGroup)).toBe(LOCALE_DISPLAY_OVERRIDES["Europe"].subtitle);
    });

    test("should render the display overrides as the card title and subtitle", () => {
      // GIVEN a group with the locale "Europe"
      const givenGroup = getTestGroup();
      givenGroup.locale = { ...givenGroup.locale, name: "Europe" };

      // WHEN the component is rendered
      renderModelCard(givenGroup);

      // THEN expect the title and the subtitle to be the display overrides
      expect(screen.getByTestId(DATA_TEST_ID.MODEL_CARD_TITLE)).toHaveTextContent("Tabiya ESCO");
      expect(screen.getByTestId(DATA_TEST_ID.MODEL_CARD_SUBTITLE)).toHaveTextContent(
        LOCALE_DISPLAY_OVERRIDES["Europe"].subtitle as string
      );
    });
  });

  test("getDescriptionStyle should clamp the description when collapsed and show it fully when expanded", () => {
    // GIVEN the card is collapsed
    // WHEN getDescriptionStyle is called
    // THEN expect the description to be clamped to a few lines
    expect(getDescriptionStyle(false)).toEqual(
      expect.objectContaining({
        WebkitLineClamp: 3,
        overflow: "hidden",
      })
    );

    // AND GIVEN the card is expanded
    // WHEN getDescriptionStyle is called
    // THEN expect no clamping so the full description is shown
    expect(getDescriptionStyle(true)).toEqual({});
  });
});
