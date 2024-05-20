// mute the console
import "src/_test_utilities/consoleMock";
import { render, screen, waitFor } from "src/_test_utilities/test-utils";
import AppLayout, { DATA_TEST_ID, SIDEBAR_ANIMATION_DURATION_SECONDS } from "./AppLayout";
import { DATA_TEST_ID as APP_SIDE_BAR_ID } from "./AppSidebar";
import { DATA_TEST_ID as APP_HEADER_ID } from "./AppHeader";
import userEvent from "@testing-library/user-event";

import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

// Mocking the AppSidebar and AppHeader components
jest.mock("./AppSidebar", () => {
  const actual = jest.requireActual("./AppSidebar");
  const mockedAppSidebar = jest
    .fn()
    .mockImplementation(() => <div data-testid={actual.DATA_TEST_ID.CONTAINER}>Mocked AppSidebar</div>);
  return {
    __esModule: true,
    ...actual,
    default: mockedAppSidebar,
  };
});

// Mocking the AppHeader component
jest.mock("./AppHeader", () => {
  const actual = jest.requireActual("./AppHeader");
  const mockedAppHeader = jest
    .fn()
    .mockImplementation(() => <div data-testid={actual.DATA_TEST_ID.APP_HEADER_CONTAINER}>Mocked AppHeader</div>);

  return {
    __esModule: true,
    ...actual,
    default: mockedAppHeader,
  };
});

describe("AppLayout render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "AppLayout",
      Component: (
        <AppLayout>
          <div>foo</div>
        </AppLayout>
      ),
      roles: ALL_USERS,
      testIds: [DATA_TEST_ID.LAYOUT, DATA_TEST_ID.TOGGLE_BUTTON],
    })
  );

  test("should render app layout component", () => {
    // GIVEN a Layout Children component
    const LayoutChildren = () => <div>foo</div>;

    // WHEN the AppLayout component is rendered
    render(
      <AppLayout>
        <LayoutChildren />
      </AppLayout>
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND expect layout to be present in the document
    const actualAppLayout = screen.getByTestId(DATA_TEST_ID.LAYOUT);
    expect(actualAppLayout).toBeInTheDocument();

    // AND the toggle button to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.TOGGLE_BUTTON)).toBeInTheDocument();

    // AND to match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.LAYOUT)).toMatchSnapshot();

    // AND expect the AppSidebar and AppHeader to be in the document
    expect(screen.getByTestId(APP_SIDE_BAR_ID.CONTAINER)).toBeInTheDocument();
    expect(screen.getByTestId(APP_HEADER_ID.APP_HEADER_CONTAINER)).toBeInTheDocument();

    // AND expect the child component to be in the document
    expect(screen.getByText("foo")).toBeInTheDocument();
  });
});

describe("AppLayout action tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("toggle button can close and reopen the add sidebar", async () => {
    // GIVEN a Layout Children component
    const LayoutChildren = () => <div>foo</div>;

    // WHEN the AppLayout component is rendered
    render(
      <AppLayout>
        <LayoutChildren />
      </AppLayout>
    );

    // THEN expect the AppSidebar to be visible
    await waitFor(() => {
      expect(screen.getByTestId(APP_SIDE_BAR_ID.CONTAINER)).toBeVisible();
    });
    // AND  the AppHeader to be in the document
    expect(screen.getByTestId(APP_HEADER_ID.APP_HEADER_CONTAINER)).toBeInTheDocument();
    // AND the child component to be in the document
    expect(screen.getByText("foo")).toBeInTheDocument();

    // AND WHEN the toggle button is clicked
    jest.useFakeTimers();
    const toggleButton = screen.getByTestId(DATA_TEST_ID.TOGGLE_BUTTON);
    const userEventFakeTimer = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await userEventFakeTimer.click(toggleButton);
    // AND the time is advanced by the duration of the animation
    jest.advanceTimersByTime(SIDEBAR_ANIMATION_DURATION_SECONDS * 1000);

    // THEN expect the AppSidebar to be hidden
    await waitFor(() => {
      expect(screen.queryByTestId(APP_SIDE_BAR_ID.CONTAINER)).not.toBeVisible();
    });

    // AND WHEN the toggle button is clicked again
    await userEventFakeTimer.click(toggleButton);
    // AND the time is advanced by the duration of the animation
    jest.advanceTimersByTime(SIDEBAR_ANIMATION_DURATION_SECONDS * 1000);
    // THEN expect the AppSidebar to be shown
    await waitFor(() => {
      expect(screen.queryByTestId(APP_SIDE_BAR_ID.CONTAINER)).toBeVisible();
    });
  });
});
