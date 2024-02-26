import "src/_test_utilities/consoleMock";
import { renderHook, act } from "@testing-library/react";
import { useResponsiveStyleValue } from "./useResponsiveStyleValue";

const MOCKED_COMPUTED_VALUE = "46";

describe("useResponsiveStyleValue", () => {
  let mockDiv: any;

  beforeEach(() => {
    mockDiv = document.createElement("div");

    // Mock window.getComputedStyle
    window.getComputedStyle = jest.fn().mockImplementation(() => {
      return {
        getPropertyValue: jest.fn().mockReturnValue(MOCKED_COMPUTED_VALUE),
      };
    });
  });

  it("returns the computed style value of the specified CSS property on mount", () => {
    // GIVEN a div with a padding cal(3rem - 2px) which is 46px
    const cssProperty = "padding";
    mockDiv.style[cssProperty] = "cal(3rem - 2px)";
    const ref = { current: mockDiv };

    // WHEN we call useResponsiveStyleValue with the ref and the CSS property
    const { result } = renderHook(() => useResponsiveStyleValue(ref, cssProperty));
    // THEN we expect the computed value to be 10px
    expect(result.current).toBe(MOCKED_COMPUTED_VALUE);
  });

  it("updates the computed value on window resize", () => {
    // GIVEN a div with a height 10px
    const cssProperty = "height";
    mockDiv.style[cssProperty] = "10px";
    const ref = { current: mockDiv };

    const { result } = renderHook(() => useResponsiveStyleValue(ref, cssProperty));

    // WHEN we change the height to 46px
    mockDiv.style[cssProperty] = "cal(3rem - 2px)";

    act(() => {
      // AND we dispatch a window resize event
      window.dispatchEvent(new Event("resize"));
    });

    // THEN we expect the computed value to be 46px
    expect(result.current).toBe(MOCKED_COMPUTED_VALUE);
  });

  it("returns undefined if ref.current is null", () => {
    // GIVEN a ref with a null current value
    const cssProperty = "font-size";
    const ref = { current: null };
    // WHEN we call useResponsiveStyleValue with the ref and the CSS property
    const { result } = renderHook(() => useResponsiveStyleValue(ref, cssProperty));

    // THEN we expect the computed value to be undefined
    expect(result.current).toBeUndefined();
  });
});
