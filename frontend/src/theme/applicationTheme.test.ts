import applicationTheme, { ThemeMode } from "./applicationTheme";

describe("applicationTheme", () => {
  // should return the Light theme
  it("should return the Light theme", () => {
    applicationTheme(ThemeMode.LIGHT);
    expect(applicationTheme).toMatchSnapshot();
  });
  // should return the Dark theme
  it("should return the Dark theme", () => {
    applicationTheme(ThemeMode.DARK);
    expect(applicationTheme).toMatchSnapshot();
  });
});
