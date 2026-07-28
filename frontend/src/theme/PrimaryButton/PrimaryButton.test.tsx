// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import PrimaryButton, { getOutlinedButtonSx } from "./PrimaryButton";
import { mockBrowserIsOnLine, unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";
import applicationTheme, { ThemeMode } from "src/theme/applicationTheme/applicationTheme";

describe("Primary Button tests", () => {
  beforeEach(() => {
    unmockBrowserIsOnLine();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render the button with default props", () => {
    // GIVEN a PrimaryButton component
    // WHEN the component is rendered
    render(<PrimaryButton data-testid={"foo"} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND  the component should be in the document
    const primaryButton = screen.getByTestId("foo");
    expect(primaryButton).toBeInTheDocument();
    // AND the component should match the snapshot
    expect(primaryButton).toMatchSnapshot();
  });

  test("should render the button with provided name", () => {
    // GIVEN a PrimaryButton component with a custom name
    const customName = "Foo Bar";

    // WHEN the component is rendered
    render(<PrimaryButton>{customName}</PrimaryButton>);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND  the component should be findable by the custom name
    const primaryButton = screen.getByText(customName);
    // AND the component should be in the document
    expect(primaryButton).toBeInTheDocument();
    // AND the component should match the snapshot
    expect(primaryButton).toMatchSnapshot();
  });

  describe.each([
    [true, { disable: true, disableWhenOffline: true, isOnline: true }],
    [true, { disable: true, disableWhenOffline: true, isOnline: false }],
    [true, { disable: true, disableWhenOffline: false, isOnline: true }],
    [true, { disable: true, disableWhenOffline: false, isOnline: false }],
    [true, { disable: true, disableWhenOffline: undefined, isOnline: false }],
    [false, { disable: false, disableWhenOffline: true, isOnline: true }],
    [true, { disable: false, disableWhenOffline: true, isOnline: false }],
    [false, { disable: false, disableWhenOffline: false, isOnline: true }],
    [false, { disable: false, disableWhenOffline: false, isOnline: false }],
    [false, { disable: false, disableWhenOffline: undefined, isOnline: false }],
    [false, { disable: undefined, disableWhenOffline: true, isOnline: true }],
    [true, { disable: undefined, disableWhenOffline: true, isOnline: false }],
    [false, { disable: undefined, disableWhenOffline: undefined, isOnline: true }],
    [false, { disable: undefined, disableWhenOffline: undefined, isOnline: false }],
  ])("Disabled/enabled state", (expectedState, testCase) => {
    test(`should render the button disabled = ${expectedState} when ${JSON.stringify(testCase)}`, () => {
      mockBrowserIsOnLine(testCase.isOnline);

      // WHEN the component is rendered
      render(<PrimaryButton disabled={testCase.disable} disableWhenOffline={testCase.disableWhenOffline} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the button to be enabled
      const primaryButton = screen.getByRole("button");
      expect(primaryButton).toHaveProperty("disabled", expectedState);
    });
  });

  test.each(["primary", "secondary"] as const)(
    "getOutlinedButtonSx should give outlined %s buttons a resolvable border, not an alpha()-derived one",
    (color) => {
      // GIVEN the app theme
      const theme = applicationTheme(ThemeMode.LIGHT);

      // WHEN getOutlinedButtonSx is called for the outlined variant
      const sx = getOutlinedButtonSx(theme, "outlined", color);

      // THEN expect a border referencing the theme's color directly - MUI's default alpha()-derived border
      // can't parse our CSS-variable-based palette and would silently produce an invisible border
      expect(sx.border).toBe(`1px solid ${theme.palette[color].main}`);
    }
  );

  test("getOutlinedButtonSx should return no override for the contained variant", () => {
    // GIVEN the app theme
    const theme = applicationTheme(ThemeMode.LIGHT);

    // WHEN getOutlinedButtonSx is called for the (default) contained variant
    const sx = getOutlinedButtonSx(theme, "contained", "primary");

    // THEN expect no border override, since MUI's default works fine for contained buttons
    expect(sx).toEqual({});
  });

  test("should render enable->disabled->enabled when online status changes", async () => {
    // GIVEN that the internet status is online
    mockBrowserIsOnLine(true);

    // WHEN the button is rendered
    render(<PrimaryButton disableWhenOffline={true} />);

    // THEN expect the button to be enabled
    const primaryButton = screen.getByRole("button");
    expect(primaryButton).toBeEnabled();

    // WHEN the internet status changes to offline
    mockBrowserIsOnLine(false);

    // THEN expect the button to be disabled
    expect(primaryButton).toBeDisabled();

    // WHEN the internet status changes back to online
    mockBrowserIsOnLine(true);

    // THEN expect the button to be enabled
    expect(primaryButton).toBeEnabled();
  });
});
