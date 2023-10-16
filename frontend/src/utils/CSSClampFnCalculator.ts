export type ScreenSize = {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
};

/**
 * Generates a CSS clamp function that calculates a value that linearly scales between a minimum and maximum
 * value based on the current viewport size falling within specified screen dimensions.
 *
 * @param unit - The unit to use for the resulting CSS value (e.g., "rem" or "px").
 * @param minValue - The minimum value to clamp.
 * @param maxValue - The maximum value to clamp.
 * @param screenSize - An object representing the minimum and maximum dimensions of the screen.
 *
 * @returns - A CSS clamp function as a string, ready to be used in your stylesheets.
 */
function CSSClampFnCalculator(unit: "rem" | "px", minValue: number, maxValue: number, screenSize: ScreenSize): string {
  // height
  const heightScaleFactor: number = round(
    ((maxValue - minValue) / (screenSize.maxHeight - screenSize.minHeight + Number.EPSILON)) * 100
  );
  const heightOffset: number = round(minValue - (heightScaleFactor / 100) * screenSize.minHeight);
  const heightPart: string = `${heightScaleFactor}vh + ${heightOffset}${unit}`;
  // width
  const widthScaleFactor: number = round(
    ((maxValue - minValue) / (screenSize.maxWidth - screenSize.minWidth + Number.EPSILON)) * 100
  );
  const widthOffset: number = round(minValue - (widthScaleFactor / 100) * screenSize.minWidth);
  const widthPart: string = `${widthScaleFactor}vw + ${widthOffset}${unit}`;

  // consider both the height and width scale factors
  const clampFn: string = `clamp(${minValue}${unit}, (${heightPart} + ${widthPart})/2 , ${maxValue}${unit})`;
  return clampFn;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function CSSClampFnCalculatorRem(minValue: number, maxValue: number, screenSize: ScreenSize) {
  return CSSClampFnCalculator("rem", minValue, maxValue, screenSize);
}

export function CSSClampFnCalculatorPx(minValue: number, maxValue: number, screenSize: ScreenSize) {
  return CSSClampFnCalculator("px", minValue, maxValue, screenSize);
}
