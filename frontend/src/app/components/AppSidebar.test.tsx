import AppSidebar, {DATA_TEST_ID, ITEMS_LABEL_TEXT} from "./AppSidebar";
import {HashRouter} from "react-router-dom";
import {fireEvent, render, screen, within} from "@testing-library/react";

const iconsDataTestId = [
  DATA_TEST_ID.APP_SIDEBAR_ICON_DIRECTORY,
  DATA_TEST_ID.APP_SIDEBAR_ICON_EXPLORE,
  DATA_TEST_ID.APP_SIDEBAR_ICON_EDIT,
  DATA_TEST_ID.APP_SIDEBAR_ICON_USER,
  DATA_TEST_ID.APP_SIDEBAR_ICON_SETTINGS
];

describe("AppSidebar", () => {
  
  const allIconsCases = [
    ["#/", iconsDataTestId[0], DATA_TEST_ID.APP_SIDEBAR_DIRECTORY_LINK],
    ["#/explore", iconsDataTestId[1], DATA_TEST_ID.APP_SIDEBAR_EXPLORE_LINK],
    ["#/edit", iconsDataTestId[2], DATA_TEST_ID.APP_SIDEBAR_EDIT_LINK],
    ["#/users", iconsDataTestId[3], DATA_TEST_ID.APP_SIDEBAR_USER_LINK],
    ["#/settings", iconsDataTestId[4], DATA_TEST_ID.APP_SIDEBAR_SETTINGS_LINK],
  ];

  test("renders correctly", () => {
    // GIVEN a AppSidebar component that has access to the router
    const givenAppSidebar = (
      <HashRouter>
        <AppSidebar />
      </HashRouter>
    );

    // WHEN it is rendered
    render(givenAppSidebar);

    // THEN expect it to be shown
    const appSidebarContainer = screen.getByTestId(
      DATA_TEST_ID.APP_SIDEBAR_CONTAINER,
    );
    expect(appSidebarContainer).toBeInTheDocument();
  });

  test.each(allIconsCases)(
    `renders %s icon and it's label`,
    (iconLinkPathname, iconDataTestId, linkDataTestId) => {
      // GIVEN a AppSidebar component that has access to the router
      const givenAppSidebar = (
        <HashRouter>
          <AppSidebar />
        </HashRouter>
      );

      // WHEN it is rendered
      render(givenAppSidebar);

      // THEN expect the icon to be shown wrapped in a link
      const linkElement = screen.getByTestId(linkDataTestId);
      const iconElement = within(linkElement).getByTestId(iconDataTestId);
      expect(iconElement).toBeInTheDocument();
      // AND expect the icon to have the correct label
      const iconLabel = within(linkElement).getByText(ITEMS_LABEL_TEXT[iconDataTestId]);
      expect(iconLabel).toBeInTheDocument();
      // AND the link to point to the correct page
      expect(linkElement).toHaveAttribute("href", iconLinkPathname);
    },
  );

  test.each(allIconsCases)(
    `renders the icon selected when the active route is %s`,
    (iconLinkPathname, iconDataTestId, linkDataTestId) => {
      // GIVEN that the AppSidebar component is rendered and has access to the router
      const givenAppSidebar = (
        <HashRouter>
          <AppSidebar />
        </HashRouter>
      );
      render(givenAppSidebar);
      // AND a link element that points to the given path
      const linkElement = screen.getByTestId(linkDataTestId);

      // WHEN the link is clicked
      fireEvent.click(linkElement);

      // THEN expect the link to have the active class
      expect(linkElement).toHaveClass("active");
      // AND the icon to be shown as selected
      const iconElement = screen.getByTestId(iconDataTestId);
      const computedBackgroundColor =
        getComputedStyle(iconElement).backgroundColor;
      expect(computedBackgroundColor).toBe("rgb(92, 255, 159)");
      // AND expect the other icon links to be unselected
      iconsDataTestId
        .filter((dataTestId) => dataTestId !== iconDataTestId)
        .forEach((dataTestId) => {
          const otherIconElement = screen.getByTestId(dataTestId);
          const otherComputedBackgroundColor =
            getComputedStyle(otherIconElement).backgroundColor;
          expect(otherComputedBackgroundColor).toBe("");
        });
    },
  );
});