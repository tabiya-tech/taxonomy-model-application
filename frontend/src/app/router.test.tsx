import {render, screen} from "src/_test_utilities/test-utils";
import {
  RouterProvider,
  createMemoryRouter
} from "react-router-dom";

import routesConfig, { routerPaths} from "./routerConfig";
import {DATA_TEST_ID as INFO_DATA_TEST_ID} from "src/info/Info";
import {DATA_TEST_ID as MODEL_DIRECTORY_DATA_TEST_ID} from "src/modeldirectory/ModelDirectory";

// Mock the Info component as it has dependencies to the backend, and we do not want to test that here
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

// Mock the model directory as it has dependencies to the backend, and we do not want to test that here

jest.mock("src/modeldirectory/ModelDirectory", () => {
  const actual = jest.requireActual("src/modeldirectory/ModelDirectory");
  return {
    ...actual,
    __esModule: true,
    default: () => {
      return <div data-testid={actual.DATA_TEST_ID.MODEL_DIRECTORY_PAGE}>Model Directory</div>
    }
  }
});


function renderWithRouter(route: string) {
  const router = createMemoryRouter(routesConfig, {
    initialEntries: [route],
  });
  render(<RouterProvider router={router}/>);
}

describe("Tests for router config", () => {
  it("should render the full application given root", async () => {
    // WHEN the ROOT is chosen
    renderWithRouter(routerPaths.ROOT);

    // THEN expect model directory to be the landing page
    expect(screen.getByTestId(MODEL_DIRECTORY_DATA_TEST_ID.MODEL_DIRECTORY_PAGE)).toBeInTheDocument();
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

  it("should render the Users", async () => {
    // WHEN the USERS path is chosen
    renderWithRouter(routerPaths.USERS);

    // THEN expect the application users to be available
    expect(screen.getByText("Coming soon, the application users")).toBeInTheDocument();
  });

  it("should render the Model Edit", async () => {
    // WHEN the EDIT path is chosen
    renderWithRouter(routerPaths.EDIT);

    // THEN expect editing the model to be available
    expect(screen.getByText("Coming soon, editing the model")).toBeInTheDocument();
  });

  it("should render the Model Explore", async () => {
    // WHEN the EXPLORE path is chosen
    renderWithRouter(routerPaths.EXPLORE);

    // THEN expect exploring the model to be available
    expect(screen.getByText("Coming soon, exploring the model")).toBeInTheDocument();
  });
})
