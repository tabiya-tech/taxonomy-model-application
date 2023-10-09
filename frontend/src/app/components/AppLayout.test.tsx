// mute the console
import "src/_test_utilities/consoleMock";
import { render, screen } from "src/_test_utilities/test-utils";
import AppLayout, { DATA_TEST_ID } from "./AppLayout";
import { DATA_TEST_ID as APP_SIDE_BAR_ID } from "./AppSidebar";
import { DATA_TEST_ID as APP_HEADER_ID } from "./AppHeader";

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

describe("AppLayout Render", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

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
    expect(screen.getByTestId(DATA_TEST_ID.LAYOUT)).toBeInTheDocument();

    // AND expect the AppSidebar and AppHeader to be in the document
    expect(screen.getByTestId(APP_SIDE_BAR_ID.CONTAINER)).toBeInTheDocument();
    expect(screen.getByTestId(APP_HEADER_ID.APP_HEADER_CONTAINER)).toBeInTheDocument();

    // AND expect the child component to be in the document
    expect(screen.getByText("foo")).toBeInTheDocument();
  });
});
