import {render, screen} from "src/_test_utilities/test-utils";
import {
  RouterProvider,
  createMemoryRouter
} from "react-router-dom";

import routesConfig, {DATA_TEST_ID as LANDING_PAGE_DATA_TEST_ID, routerPaths} from "./routerConfig";
import {DATA_TEST_ID as INFO_DATA_TEST_ID} from "./info/Info";
import {DATA_TEST_ID as MODEL_DIRECTORY_DATA_TEST_ID} from "./modeldirectory/ModelDirectory";

// Mock the Info component as it has dependencies to the backend and we do not want to test that here
jest.mock("src/info/Info", () => {
  const actual = jest.requireActual("src/info/Info");
  return {
    ...actual,
    __esModule: true,
    default: () => {
      return <div data-testid={actual.DATA_TEST_ID.INFO_ROOT}>Info</div>
    }
  }
});

function renderWithRouter(route: string) {
  const router = createMemoryRouter(routesConfig, {
    initialEntries: [route],
  });
  render(
    <RouterProvider router={router}/>
  );
}

describe("Tests for router config", () => {
  it("should render the full application given root", async () => {
    // WHEN  the root path is chosen
    renderWithRouter(routerPaths.ROOT);

    // THEN expect the landing page to be available
    expect(screen.getByTestId(LANDING_PAGE_DATA_TEST_ID.LANDING_PAGE)).toBeInTheDocument();
  });

  it("should render the info", async () => {
    // WHEN the info path is chosen
    renderWithRouter(routerPaths.INFO);

    // THEN expect the info page to be available
    expect(screen.getByTestId(INFO_DATA_TEST_ID.INFO_ROOT)).toBeInTheDocument();
  });

  it("should render the Model Directory", async () => {
    // WHEN the model directory path is chosen
    renderWithRouter(routerPaths.MODEL_DIRECTORY);

    // THEN expect the model directory to be available
    expect(screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE)).toBeInTheDocument();
  });
})
