import AppSidebar, {DATA_TEST_ID, ITEMS_LABEL_TEXT} from "./AppSidebar";
import {HashRouter} from "react-router-dom";
import {render, screen, within} from "src/_test_utilities/test-utils";
import {routerPaths} from "src/app/routerConfig";
import {testNavigateToPath} from "src/_test_utilities/routeNavigation";

describe("AppSidebar render tests", () => {

  test("renders correctly", () => {
    // GIVEN a AppSidebar component that has access to the router
    const givenAppSidebar = (
      <HashRouter>
        <AppSidebar/>
      </HashRouter>
    );

    // WHEN it is rendered
    render(givenAppSidebar);

    // THEN expect it to be shown
    const appSidebarContainer = screen.getByTestId(DATA_TEST_ID.CONTAINER);
    expect(appSidebarContainer).toBeInTheDocument();
  });

  const allIconsCases = [
    ["Directory", DATA_TEST_ID.DIRECTORY_LINK, DATA_TEST_ID.DIRECTORY_ICON, ITEMS_LABEL_TEXT.DIRECTORY],
    ["Explore", DATA_TEST_ID.EXPLORE_LINK, DATA_TEST_ID.EXPLORE_ICON, ITEMS_LABEL_TEXT.EXPLORE],
    ["User", DATA_TEST_ID.USER_LINK, DATA_TEST_ID.USER_ICON, ITEMS_LABEL_TEXT.USER],
    ["Settings", DATA_TEST_ID.SETTINGS_LINK, DATA_TEST_ID.SETTINGS_ICON, ITEMS_LABEL_TEXT.SETTINGS],
  ];

  it.each(allIconsCases)
  ("should render %s link correct", (description, linkDataTestId, iconDataTestId, expectedLinkText) => {
      // GIVEN a AppSidebar component that has access to the router
      const givenAppSidebar = (
        <HashRouter>
          <AppSidebar/>
        </HashRouter>
      );

      // WHEN it is rendered
      render(givenAppSidebar);

      // THEN expect the link to be shown
      const linkElement = screen.getByTestId(linkDataTestId);
      expect(linkElement).toBeInTheDocument();

      // AND the icon to be shown wrapped in the link
      const iconElement = within(linkElement).getByTestId(iconDataTestId);
      expect(iconElement).toBeInTheDocument();

      // AND expect the link to have the correct label
      expect(linkElement).toHaveTextContent(expectedLinkText);
    },
  );
});

describe("AppSidebar action tests", () => {
  const allRouterCases = [
    ["Directory", DATA_TEST_ID.DIRECTORY_LINK, routerPaths.MODEL_DIRECTORY],
    ["Explore", DATA_TEST_ID.EXPLORE_LINK, routerPaths.EXPLORE],
    ["Edit", DATA_TEST_ID.EDIT_LINK, routerPaths.EDIT],
    ["User", DATA_TEST_ID.USER_LINK, routerPaths.USERS],
    ["Settings", DATA_TEST_ID.SETTINGS_LINK, routerPaths.SETTINGS],
  ];
  allRouterCases.forEach(([linkName, linkTestId, expectedPath]) => {
    testNavigateToPath(<AppSidebar/>, linkName, linkTestId, expectedPath);
  });
});