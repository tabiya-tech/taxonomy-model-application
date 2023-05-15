import {render, screen} from "@testing-library/react";
import {
  RouterProvider,
  createMemoryRouter
} from "react-router-dom";

import routesConfig, {routerPaths} from "./routerConfig";
import {DATA_TEST_ID as IMPORT_DATA_TEST_ID} from "./import/ImportModel";
import {DATA_TEST_ID as INFO_DATA_TEST_ID} from "./info/Info";

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
    renderWithRouter(routerPaths.ROOT);
    // verify page content for default route
    expect(screen.getByTestId(IMPORT_DATA_TEST_ID.WELCOME_PAGE_ROOT)).toBeInTheDocument();
  });

  it("should render the full application given root", async () => {
    renderWithRouter(routerPaths.INFO);
    // verify page content for default route
    expect(screen.getByTestId(INFO_DATA_TEST_ID.VERSION_FRONT_ROOT)).toBeInTheDocument();
  });

  it("should render the import dialog", async () => {
    renderWithRouter(routerPaths.IMPORT);
    // verify page content for default route
    expect(screen.getByTestId(IMPORT_DATA_TEST_ID.DIALOG_ROOT)).toBeInTheDocument();
  });
})
