// mute the console
import "src/_test_utilities/consoleMock";

import AppHeader, { DATA_TEST_ID, MENU_ITEM_ID, MENU_ITEM_TEXT } from "./AppHeader";
import { render, screen } from "src/_test_utilities/test-utils";
import { HashRouter } from "react-router-dom";
import { routerPaths } from "src/app/routerConfig";

import { testNavigateToPath } from "src/_test_utilities/routeNavigation";
import { fireEvent, waitFor, within } from "@testing-library/react";
import { AuthContext, authContextDefaultValue } from "src/app/providers/AuthProvider";
import ContextMenu from "src/theme/ContextMenu/ContextMenu";

// mock the ContextMenu
jest.mock("src/theme/ContextMenu/ContextMenu", () => {
  const actual = jest.requireActual("src/theme/ContextMenu/ContextMenu");
  const mockContextMenu = jest.fn().mockImplementation(() => {
    return <div data-testid="mock-context-menu"></div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockContextMenu,
  };
});

describe("AppHeader render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("renders correctly with unauthenticated state", () => {
    // GIVEN a AppHeader component that has access to the router
    const mockLoginFn = jest.fn();
    const givenAppHeader = (
      <HashRouter>
        <AuthContext.Provider
          value={{
            ...authContextDefaultValue,
            user: null,
            login: mockLoginFn,
          }}
        >
          <AppHeader />
        </AuthContext.Provider>
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
    // AND the auth button to be shown with the user icon
    const appHeaderAuthButton = screen.getByTestId(DATA_TEST_ID.APP_HEADER_AUTH_BUTTON);
    expect(appHeaderAuthButton).toBeInTheDocument();
    const appHeaderUserIcon = within(appHeaderAuthButton).getByTestId(DATA_TEST_ID.APP_HEADER_ICON_USER);
    expect(appHeaderUserIcon).toBeInTheDocument();
    // AND the contextMenu to be called with the correct initial props
    const expectedContextMenuProps = {
      anchorEl: null,
      open: false,
      items: [
        {
          id: MENU_ITEM_ID.LOGIN,
          text: MENU_ITEM_TEXT.LOGIN,
          icon: expect.anything(),
          disabled: false,
          action: mockLoginFn,
        },
      ],
    };
    expect(ContextMenu).toHaveBeenCalledWith(expect.objectContaining(expectedContextMenuProps), {});
    // AND to match the snapshot
    expect(appHeaderContainer).toMatchSnapshot();
  });

  test("renders correctly when the user is logged in", () => {
    // GIVEN a AppHeader component that has access to the router and the user is logged in
    const mockLogoutFn = jest.fn();
    const givenAppHeader = (
      <HashRouter>
        <AuthContext.Provider
          value={{
            ...authContextDefaultValue,
            user: { firstName: "John", lastName: "Doe", roles: [] },
            logout: mockLogoutFn,
          }}
        >
          <AppHeader />
        </AuthContext.Provider>
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
    // AND the auth button to be shown with the user icon
    const appHeaderAuthButton = screen.getByTestId(DATA_TEST_ID.APP_HEADER_AUTH_BUTTON);
    expect(appHeaderAuthButton).toBeInTheDocument();
    const appHeaderUserIcon = within(appHeaderAuthButton).getByTestId(DATA_TEST_ID.APP_HEADER_ICON_USER);
    expect(appHeaderUserIcon).toBeInTheDocument();
    // AND the contextMenu to be called with the correct initial props
    const expectedContextMenuProps = {
      anchorEl: null,
      open: false,
      items: [
        {
          id: MENU_ITEM_ID.LOGOUT,
          text: MENU_ITEM_TEXT.LOGOUT,
          icon: expect.anything(),
          disabled: false,
          action: mockLogoutFn,
        },
      ],
    };
    expect(ContextMenu).toHaveBeenCalledWith(expect.objectContaining(expectedContextMenuProps), {});
    // AND to match the snapshot
    expect(appHeaderContainer).toMatchSnapshot();
  });
});

describe("AppHeader action tests", () => {
  testNavigateToPath(<AppHeader />, "Logo", DATA_TEST_ID.APP_HEADER_LOGO_LINK, routerPaths.ROOT);

  test("shows the auth menu when the auth button is clicked", async () => {
    // GIVEN that the AppHeader component is rendered with access to the router
    render(
      <HashRouter>
        <AppHeader />
      </HashRouter>
    );

    // WHEN the auth button is clicked
    const appHeaderAuthButton = screen.getByTestId(DATA_TEST_ID.APP_HEADER_AUTH_BUTTON);
    fireEvent.click(appHeaderAuthButton);

    // THEN expect the auth menu to be shown
    await waitFor(() => {
      expect(ContextMenu).toHaveBeenCalledWith(
        expect.objectContaining({ anchorEl: appHeaderAuthButton, open: true }),
        {}
      );
    });
  });
});
