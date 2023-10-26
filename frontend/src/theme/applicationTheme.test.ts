import applicationTheme, { ThemeMode } from "./applicationTheme";

describe.each([ThemeMode.LIGHT, ThemeMode.DARK])("%s theme mode", (givenThemeMode) => {
  it(`should return the ${givenThemeMode} theme`, () => {
    // WHEN getting the theme
    const actualTheme = applicationTheme(givenThemeMode);

    // THEN we should get the correct theme
    expect(actualTheme).toMatchSnapshot();
  });

  it("call spacing function (responsive)", () => {
    // GIVEN the theme
    const givenTheme = applicationTheme(givenThemeMode);
    // AND some spacing factor
    const givenSpacingFactor = 2;

    // WHEN we call the spacing function
    const actualSpacing = givenTheme.spacing(givenSpacingFactor);

    // THEN we should get a dynamic (responsive) value
    expect(actualSpacing).toMatch(RegExp(`calc\\(clamp\\(.+\\) \\* ${givenSpacingFactor}\\)`));
    // AND get the correct spacing
    expect(actualSpacing).toMatchSnapshot();
  });

  it("call fixedSpacing function (non-responsive)", () => {
    // GIVEN the theme
    const givenTheme = applicationTheme(givenThemeMode);
    // AND some spacing factor
    const givenSpacingFactor = 2;

    // WHEN we call the spacing function
    const actualSpacing = givenTheme.fixedSpacing(givenSpacingFactor);

    // THEN we should get a fixed value
    expect(actualSpacing).toMatch(/\d+px/);
    // AND get the correct spacing
    expect(actualSpacing).toMatchSnapshot();
  });

  it("call responsiveBorderRounding function (responsive)", () => {
    // GIVEN the theme
    const givenTheme = applicationTheme(givenThemeMode);
    // AND some rounding factor
    const givenRoundingFactor = 2;

    // WHEN we call the responsiveBorderRounding function
    const actualRounding = givenTheme.responsiveBorderRounding(givenRoundingFactor);

    // THEN we should get a dynamic (responsive) value
    expect(actualRounding).toMatch(RegExp(`calc\\(clamp\\(.+\\) \\* ${givenRoundingFactor}\\)`));
    // AND get the correct rounding
    expect(actualRounding).toMatchSnapshot();
  });

  it("call responsiveBorderRounding function with 'full' rounding (responsive)", () => {
    // GIVEN the theme
    const givenTheme = applicationTheme(givenThemeMode);
    // AND a 'full' rounding factor
    const givenRoundingFactor = givenTheme.tabiyaRounding.full;

    // WHEN we call the responsiveBorderRounding function
    const actualRounding = givenTheme.responsiveBorderRounding(givenRoundingFactor);

    // THEN we should get a dynamic (responsive) value
    expect(actualRounding).toEqual(givenRoundingFactor);
    // AND get the correct rounding
    expect(actualRounding).toMatchSnapshot();
  });

  it("call rounding function (non-responsive)", () => {
    // GIVEN the theme
    const givenTheme = applicationTheme(givenThemeMode);
    // AND some rounding factor
    const givenRoundingFactor = 2;

    // WHEN we call the rounding function
    const actualRounding = givenTheme.rounding(givenRoundingFactor);

    // THEN we should get a fixed value
    expect(actualRounding).toMatch(/\d+px/);
    // AND get the correct rounding
    expect(actualRounding).toMatchSnapshot();
  });

  it("call rounding function with 'full' rounding (non-responsive)", () => {
    // GIVEN the theme
    const givenTheme = applicationTheme(givenThemeMode);
    // AND a 'full' rounding factor
    const givenRoundingFactor = givenTheme.tabiyaRounding.full;

    // WHEN we call the rounding function
    const actualRounding = givenTheme.rounding(givenRoundingFactor);

    // THEN we should get a fixed value
    expect(actualRounding).toEqual(givenRoundingFactor);
    // AND get the correct rounding
    expect(actualRounding).toMatchSnapshot();
  });
});
