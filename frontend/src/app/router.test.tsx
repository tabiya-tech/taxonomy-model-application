import { render, screen } from "src/_test_utilities/test-utils";
import { RouterProvider, createMemoryRouter, generatePath } from "react-router-dom";
import routesConfig from "./routerConfig";
import { routerPaths } from "src/app/routerPaths";
import { DATA_TEST_ID as INFO_DATA_TEST_ID } from "src/info/Info";
import { DATA_TEST_ID as MODEL_DIRECTORY_DATA_TEST_ID } from "src/modeldirectory/ModelDirectory";
import { DATA_TEST_ID as NOT_FOUND_DATA_TEST_ID } from "src/errorPage/NotFound";
import { DATA_TEST_ID as MODEL_SELECTION_PAGE_DATA_TEST_ID } from "src/explorer/ModelSelectionPage";
import { DATA_TEST_ID as EXPLORER_PAGE_DATA_TEST_ID } from "src/explorer/ExplorerPage";

// Mock the Info component as it has dependencies to the backend, and we do not want to test that here
jest.mock("src/info/Info", () => {
  const actual = jest.requireActual("src/info/Info");
  return {
    ...actual,
    __esModule: true,
    default: () => {
      return <div data-testid={actual.DATA_TEST_ID.INFO_ROOT}>Info</div>;
    },
  };
});

// Mock the model directory as it has dependencies to the backend, and we do not want to test that here
jest.mock("src/modeldirectory/ModelDirectory", () => {
  const actual = jest.requireActual("src/modeldirectory/ModelDirectory");
  return {
    ...actual,
    __esModule: true,
    default: () => {
      return <div data-testid={actual.DATA_TEST_ID.MODEL_DIRECTORY_PAGE}>Model Directory</div>;
    },
  };
});

// Mock the not found page as it has no dependencies but keeps the test isolated
jest.mock("src/errorPage/NotFound", () => {
  const actual = jest.requireActual("src/errorPage/NotFound");
  return {
    ...actual,
    __esModule: true,
    default: () => {
      return <div data-testid={actual.DATA_TEST_ID.NOT_FOUND_CONTAINER}>Oops, page not found!</div>;
    },
  };
});

function renderWithRouter(route: string) {
  const router = createMemoryRouter(routesConfig, {
    initialEntries: [route],
  });
  render(<RouterProvider router={router} />);

  return { router };
}

describe("Tests for router config", () => {
  it("should render the full application given root", async () => {
    // WHEN the ROOT is chosen
    renderWithRouter(routerPaths.ROOT);

    // THEN expect model directory to be the landing page
    expect(screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE)).toBeInTheDocument();
  });

  it("should redirect from ROOT to MODEL_DIRECTORY", async () => {
    // WHEN the ROOT is chosen
    const { router } = renderWithRouter(routerPaths.ROOT);

    // THEN expect the path to be changed to the model directory
    const expectedPathname = router.state.location.pathname;
    expect(expectedPathname).toBe(routerPaths.MODEL_DIRECTORY);
  });

  it("should render the settings", async () => {
    // WHEN the SETTINGS is chosen
    renderWithRouter(routerPaths.SETTINGS);

    // THEN expect the info page to be available
    expect(screen.getByTestId(INFO_DATA_TEST_ID.INFO_ROOT)).toBeInTheDocument();
  });

  it("should render the Model Directory", async () => {
    // WHEN the MODEL_DIRECTORY path is chosen
    renderWithRouter(routerPaths.MODEL_DIRECTORY);

    // THEN expect the model directory to be available
    expect(screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE)).toBeInTheDocument();
  });

  it("should render the explorer page", () => {
    // WHEN the EXPLORER path is chosen
    renderWithRouter(routerPaths.EXPLORER);

    // THEN expect the explorer page to be available
    expect(screen.getByTestId(MODEL_SELECTION_PAGE_DATA_TEST_ID.MODEL_SELECTION_PAGE)).toBeInTheDocument();
  });

  it("should render the occupations page", () => {
    // GIVEN an occupations path with a model ID
    const givenPath = generatePath(routerPaths.EXPLORER_OCCUPATIONS, { modelId: "some-model-id" });

    // WHEN the EXPLORER_OCCUPATIONS path is chosen
    renderWithRouter(givenPath);

    // THEN expect the explorer page to be available
    expect(screen.getByTestId(EXPLORER_PAGE_DATA_TEST_ID.EXPLORER_PAGE)).toBeInTheDocument();
  });

  it("should render the occupations detail page", () => {
    // GIVEN an occupations detail path with a model ID and occupation ID
    const givenPath = generatePath(routerPaths.EXPLORER_OCCUPATIONS_DETAIL, {
      modelId: "some-model-id",
      occupationId: "some-occupation-id",
    });

    // WHEN the EXPLORER_OCCUPATIONS_DETAIL path is chosen
    renderWithRouter(givenPath);

    // THEN expect the explorer page to be available
    expect(screen.getByTestId(EXPLORER_PAGE_DATA_TEST_ID.EXPLORER_PAGE)).toBeInTheDocument();
  });

  it("should render the skills page", () => {
    // GIVEN a skills path with a model ID
    const givenPath = generatePath(routerPaths.EXPLORER_SKILLS, { modelId: "some-model-id" });

    // WHEN the EXPLORER_SKILLS path is chosen
    renderWithRouter(givenPath);

    // THEN expect the explorer page to be available
    expect(screen.getByTestId(EXPLORER_PAGE_DATA_TEST_ID.EXPLORER_PAGE)).toBeInTheDocument();
  });

  it("should render the skills detail page", () => {
    // GIVEN a skills detail path with a model ID and skill ID
    const givenPath = generatePath(routerPaths.EXPLORER_SKILLS_DETAIL, {
      modelId: "some-model-id",
      skillId: "some-skill-id",
    });

    // WHEN the EXPLORER_SKILLS_DETAIL path is chosen
    renderWithRouter(givenPath);

    // THEN expect the explorer page to be available
    expect(screen.getByTestId(EXPLORER_PAGE_DATA_TEST_ID.EXPLORER_PAGE)).toBeInTheDocument();
  });

  it("should render not found page", () => {
    // WHEN an unknown path is chosen
    renderWithRouter("/unknown");

    // THEN expect the not found page to be available
    expect(screen.getByTestId(NOT_FOUND_DATA_TEST_ID.NOT_FOUND_CONTAINER)).toBeInTheDocument();
  });
});
