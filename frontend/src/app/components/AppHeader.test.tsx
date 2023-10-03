// mute the console
import 'src/_test_utilities/consoleMock';

import AppHeader, {DATA_TEST_ID} from "./AppHeader";
import {render, screen, within} from "src/_test_utilities/test-utils";
import {HashRouter} from "react-router-dom";
import {routerPaths} from "src/app/routerConfig";

import {testNavigateToPath} from "src/_test_utilities/routeNavigation";

describe("AppHeader render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("renders correctly", () => {
    // GIVEN a AppHeader component that has access to the router
    const givenAppHeader = <HashRouter><AppHeader/></HashRouter>;

    // WHEN it is rendered
    render(givenAppHeader);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the header to be shown
    const appHeaderContainer = screen.getByTestId(DATA_TEST_ID.APP_HEADER_CONTAINER);
    expect(appHeaderContainer).toBeInTheDocument();
    // AND the icons container to be shown
    const appHeaderIconsContainer = screen.getByTestId(DATA_TEST_ID.APP_HEADER_ICONS_CONTAINER);
    expect(appHeaderIconsContainer).toBeInTheDocument();
  });

  test.each([
    ["Settings", DATA_TEST_ID.APP_HEADER_ICON_SETTINGS],
    ["Language", DATA_TEST_ID.APP_HEADER_ICON_LANGUAGE],
    ["User", DATA_TEST_ID.APP_HEADER_ICON_USER]
  ])(`renders the %s icon with the icons container`, (iconName, dataTestId) => {
    // GIVEN a AppHeader component that has access to the router
    const givenAppHeader = <HashRouter><AppHeader/></HashRouter>;

    // WHEN it is rendered
    render(givenAppHeader);

    /// THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the respective icon to be shown within the icons container
    const appHeaderIconsContainer = screen.getByTestId(DATA_TEST_ID.APP_HEADER_ICONS_CONTAINER);
    const actualIcon = within(appHeaderIconsContainer).getByTestId(dataTestId);
    expect(actualIcon).toBeInTheDocument();
  });
});

describe("AppHeader action tests", () => {
  testNavigateToPath(<AppHeader/>, "Logo", DATA_TEST_ID.APP_HEADER_LOGO_LINK, routerPaths.ROOT);
});
