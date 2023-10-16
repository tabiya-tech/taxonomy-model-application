// mute the console
import "src/_test_utilities/consoleMock";

import AppHeader, { DATA_TEST_ID } from "./AppHeader";
import { render, screen } from "src/_test_utilities/test-utils";
import { HashRouter } from "react-router-dom";
import { routerPaths } from "src/app/routerConfig";

import { testNavigateToPath } from "src/_test_utilities/routeNavigation";

describe("AppHeader render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("renders correctly", () => {
    // GIVEN a AppHeader component that has access to the router
    const givenAppHeader = (
      <HashRouter>
        <AppHeader />
      </HashRouter>
    );

    // WHEN it is rendered
    render(givenAppHeader);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the header to be shown
    const appHeaderContainer = screen.getByTestId(DATA_TEST_ID.APP_HEADER_CONTAINER);
    expect(appHeaderContainer).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.APP_HEADER_CONTAINER)).toMatchSnapshot(DATA_TEST_ID.APP_HEADER_CONTAINER);
    // AND the user icon to be shown
    const appHeaderIconsContainer = screen.getByTestId(DATA_TEST_ID.APP_HEADER_ICON_USER);
    expect(appHeaderIconsContainer).toBeInTheDocument();
  });
});

describe("AppHeader action tests", () => {
  testNavigateToPath(<AppHeader />, "Logo", DATA_TEST_ID.APP_HEADER_LOGO_LINK, routerPaths.ROOT);
});
