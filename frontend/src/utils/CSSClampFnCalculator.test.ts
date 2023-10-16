import { CSSClampFnCalculatorPx, CSSClampFnCalculatorRem, ScreenSize } from "./CSSClampFnCalculator";

describe("CSSClampFnCalculatorPx", () => {
  it("should return a CSS clamp function", () => {
    // GIVEN a minimum value in pixel
    const givenMinValue = 8;
    // AND a maximum value in pixel
    const givenMaxValue = 16;
    // AND a screen size in pixel
    const givenScreenPx: ScreenSize = { minWidth: 800, maxWidth: 1200, minHeight: 500, maxHeight: 800 };

    // WHEN the function "CSSClampFnCalculator" is called with the above values
    const actualCssClampFn = CSSClampFnCalculatorPx(givenMinValue, givenMaxValue, givenScreenPx);

    // THEN expect a string representing the CSS clamp function to be returned
    expect(actualCssClampFn).toEqual("clamp(8px, (2.67vh + -5.35px + 2vw + -8px)/2 , 16px)");
  });
});

describe("CSSClampFnCalculatorRem", () => {
  it("should return a CSS clamp function", () => {
    // GIVEN a minimum value in pixel
    const givenMinValue = 0.5;
    // AND a maximum value in pixel
    const givenMaxValue = 1.5;
    // AND a screen size in pixel
    const givenScreenPx: ScreenSize = {
      minWidth: 800 / 16,
      maxWidth: 1200 / 16,
      minHeight: 500 / 16,
      maxHeight: 800 / 16,
    };

    // WHEN the function "CSSClampFnCalculator" is called with the above values
    const actualCssClampFn = CSSClampFnCalculatorRem(givenMinValue, givenMaxValue, givenScreenPx);

    // THEN expect a string representing the CSS clamp function to be returned
    expect(actualCssClampFn).toEqual("clamp(0.5rem, (5.33vh + -1.17rem + 4vw + -1.5rem)/2 , 1.5rem)");
  });
});
