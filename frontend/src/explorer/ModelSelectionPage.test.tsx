// mute the console
import "src/_test_utilities/consoleMock";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import ModelSelectionPage, { DATA_TEST_ID } from "./ModelSelectionPage";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import { getArrayOfFakeModels } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { routerPaths } from "src/app/routerPaths";

const givenModels = getArrayOfFakeModels(2);
givenModels[0] = { ...givenModels[0], name: "Taxonomy for South Africa", version: "v1.0.1-rc.1" };
givenModels[1] = { ...givenModels[1], name: "Tabiya esco-1.1.1", version: "v0.9.0" };

const renderModelSelectionPage = () =>
  render(
    <MemoryRouter initialEntries={["/explorer"]}>
      <Routes>
        <Route path={routerPaths.EXPLORER} element={<ModelSelectionPage />} />
        <Route
          path={routerPaths.EXPLORER_OCCUPATIONS}
          element={<div data-testid={routerPaths.EXPLORER_OCCUPATIONS} />}
        />
      </Routes>
    </MemoryRouter>
  );

describe("ModelSelectionPage", () => {
  let getAllModelsSpy: jest.SpyInstance;

  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    getAllModelsSpy = jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should render a loading skeleton while the models are being fetched", () => {
    // GIVEN the models fetch has not resolved yet
    getAllModelsSpy.mockImplementation(() => new Promise(() => {}));

    // WHEN the page is rendered
    renderModelSelectionPage();

    // THEN expect no model cards to be shown yet
    expect(screen.queryByTestId(`${DATA_TEST_ID.MODEL_CARD}-${givenModels[0].id}`)).not.toBeInTheDocument();
  });

  test("should render a message when there are no taxonomies available", async () => {
    // GIVEN the models service resolves with an empty list
    getAllModelsSpy.mockResolvedValue([]);

    // WHEN the page is rendered
    renderModelSelectionPage();

    // THEN expect the no-taxonomies message to be shown
    expect(await screen.findByText("No taxonomies available.")).toBeInTheDocument();
  });

  test("should render a card for each fetched model with its name, locale and version", async () => {
    // GIVEN the models service resolves with some models
    // WHEN the page is rendered
    renderModelSelectionPage();

    // THEN expect each model's card to show its name, locale and version
    for (const model of givenModels) {
      const card = await screen.findByTestId(`${DATA_TEST_ID.MODEL_CARD}-${model.id}`);
      expect(card).toHaveTextContent(model.name);
      expect(card).toHaveTextContent(`${model.locale?.name} (${model.locale?.shortCode})`);
      expect(card).toHaveTextContent(model.version);
    }
    // AND expect no errors or warnings to have been logged
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should render the empty state without crashing when fetching the models fails", async () => {
    // GIVEN fetching the models will fail
    getAllModelsSpy.mockRejectedValue(new Error("network error"));

    // WHEN the page is rendered
    renderModelSelectionPage();

    // THEN expect the no-taxonomies message to be shown, rather than the page crashing
    expect(await screen.findByText("No taxonomies available.")).toBeInTheDocument();
  });

  test("should navigate to the occupations explorer when a model card is clicked", async () => {
    // GIVEN the page has rendered its model cards
    renderModelSelectionPage();
    const card = await screen.findByTestId(`${DATA_TEST_ID.MODEL_CARD}-${givenModels[0].id}`);

    // WHEN the user clicks the first model's card
    await userEvent.click(card);

    // THEN expect to navigate to that model's occupations explorer route
    expect(await screen.findByTestId(routerPaths.EXPLORER_OCCUPATIONS)).toBeInTheDocument();
  });

  test("should navigate to the occupations explorer when a model card is activated with the keyboard", async () => {
    // GIVEN the page has rendered its model cards
    renderModelSelectionPage();
    const card = await screen.findByTestId(`${DATA_TEST_ID.MODEL_CARD}-${givenModels[0].id}`);

    // WHEN the user focuses the card and presses Enter
    card.focus();
    await userEvent.keyboard("{Enter}");

    // THEN expect to navigate to that model's occupations explorer route
    expect(await screen.findByTestId(routerPaths.EXPLORER_OCCUPATIONS)).toBeInTheDocument();
  });
});
