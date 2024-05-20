// mute the console
import "src/_test_utilities/consoleMock";

import AppSidebar, { DATA_TEST_ID, ITEMS_LABEL_TEXT } from "./AppSidebar";
import { HashRouter } from "react-router-dom";
import { render, screen, within } from "src/_test_utilities/test-utils";
import { routerPaths } from "src/app/routerConfig";
import { testNavigateToPath } from "src/_test_utilities/routeNavigation";
import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

describe("AppSidebar render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("renders correctly", () => {
    // GIVEN a AppSidebar component that has access to the router
    const givenAppSidebar = (
      <HashRouter>
        <AppSidebar />
      </HashRouter>
    );

    // WHEN it is rendered
    render(givenAppSidebar);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND to be shown
    const appSidebarContainer = screen.getByTestId(DATA_TEST_ID.CONTAINER);
    expect(appSidebarContainer).toBeInTheDocument();
    // AND to match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.CONTAINER)).toMatchSnapshot();
  });

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "AppSidebar",
      Component: (
        <HashRouter>
          <AppSidebar />
        </HashRouter>
      ),
      roles: ALL_USERS,
      testIds: [DATA_TEST_ID.CONTAINER, DATA_TEST_ID.DIRECTORY_ICON, DATA_TEST_ID.SETTINGS_ICON],
    })
  );

  const allIconsCases = [
    ["Directory", DATA_TEST_ID.DIRECTORY_LINK, DATA_TEST_ID.DIRECTORY_ICON, ITEMS_LABEL_TEXT.DIRECTORY],
    ["Settings", DATA_TEST_ID.SETTINGS_LINK, DATA_TEST_ID.SETTINGS_ICON, ITEMS_LABEL_TEXT.SETTINGS],
  ];

  it.each(allIconsCases)(
    "should render %s link correct",
    (description, linkDataTestId, iconDataTestId, expectedLinkText) => {
      // GIVEN a AppSidebar component that has access to the router
      const givenAppSidebar = (
        <HashRouter>
          <AppSidebar />
        </HashRouter>
      );

      // WHEN it is rendered
      render(givenAppSidebar);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the link to be shown
      const linkElement = screen.getByTestId(linkDataTestId);
      expect(linkElement).toBeInTheDocument();

      // AND the icon to be shown wrapped in the link
      const iconElement = within(linkElement).getByTestId(iconDataTestId);
      expect(iconElement).toBeInTheDocument();

      // AND expect the link to have the correct label
      expect(linkElement).toHaveTextContent(expectedLinkText);
    }
  );
});

describe("AppSidebar action tests", () => {
  const allRouterCases = [
    ["Directory", DATA_TEST_ID.DIRECTORY_LINK, routerPaths.MODEL_DIRECTORY],
    ["Settings", DATA_TEST_ID.SETTINGS_LINK, routerPaths.SETTINGS],
  ];
  allRouterCases.forEach(([linkName, linkTestId, expectedPath]) => {
    testNavigateToPath(<AppSidebar />, linkName, linkTestId, expectedPath);
  });
});
