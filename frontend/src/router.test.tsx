import {render, screen} from "@testing-library/react";
import {
  RouterProvider,
  createMemoryRouter, BrowserRouter, MemoryRouter,
} from "react-router-dom";

import routesConfig from "./routerConfig";
import {DATA_TEST_ID} from "./import/ImportModel";

function renderWithRouter(route: string) {
  const router = createMemoryRouter(routesConfig, {
    initialEntries: [route],
  });
  render(
    <RouterProvider router={router}/>
  );
}

describe("Tests for router config", () => {

    // TODO: implement tests for the other routes
  it.skip("should render the full application given root", async () => {
    renderWithRouter("/");
    // verify page content for default route
    //expect(screen.getByTestId(PUT THE TEST ID FROM THE MAIN CONTAINER)).toBeInTheDocument();
  });

  // TODO: implement tests for the other routes
  it.skip("should render the full application given root", async () => {
    renderWithRouter("/version");
    // verify page content for default route
    // expect(screen.getByTestId(PUT THE TEST ID FROM THE VERSION DIALOG)).toBeInTheDocument();
  });

  it("should render the import dialog", async () => {
    renderWithRouter("/import");
    // verify page content for default route
    expect(screen.getByTestId(DATA_TEST_ID.DIALOG_ROOT)).toBeInTheDocument();
  });
})
