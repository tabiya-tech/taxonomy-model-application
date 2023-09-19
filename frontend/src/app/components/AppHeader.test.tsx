import AppHeader, { DATA_TEST_ID} from "./AppHeader";
import {render, screen, within} from "@testing-library/react";
import {HashRouter} from "react-router-dom";

describe("AppHeader", () => {
    test("renders correctly", () => {
        // GIVEN a AppHeader component that has access to the router
        const givenAppHeader = <HashRouter><AppHeader/></HashRouter>;

        // WHEN it is rendered
        render(givenAppHeader);

        // THEN expect the header to be shown
        const appHeaderContainer = screen.getByTestId(DATA_TEST_ID.APP_HEADER_CONTAINER);
        expect(appHeaderContainer).toBeInTheDocument();
        // AND the app logo to be shown within a link
        const appHeaderLogoLink = screen.getByTestId(DATA_TEST_ID.APP_HEADER_LOGO_LINK);
        const appHeaderLogo = within(appHeaderLogoLink).getByTestId(DATA_TEST_ID.APP_HEADER_LOGO);
        expect(appHeaderLogo).toBeInTheDocument();
        // AND the app logo link to be a correct link element
        expect(appHeaderLogoLink).toBeInstanceOf(HTMLAnchorElement);
        // AND the link to point to the root
        expect(appHeaderLogoLink).toHaveAttribute("href", "#/");
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

        // THEN expect the respective icon to be shown within the icons container
        const appHeaderIconsContainer = screen.getByTestId(DATA_TEST_ID.APP_HEADER_ICONS_CONTAINER);
        const actualIcon = within(appHeaderIconsContainer).getByTestId(dataTestId);
        expect(actualIcon).toBeInTheDocument();
    });
});