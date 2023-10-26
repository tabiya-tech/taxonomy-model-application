import { useEffect, useState, RefObject } from "react";

export const useResponsiveStyleValue = (ref: RefObject<HTMLDivElement>, cssProperty: string) => {
  const [computedValue, setComputedValue] = useState<string>();

  useEffect(() => {
    const updateComputedValue = () => {
      if (ref?.current) {
        const style = getComputedStyle(ref?.current);
        const cssValue = style.getPropertyValue(cssProperty);
        const cssValueInt = parseFloat(cssValue);
        const cssValueRoundedInt = Math.round(cssValueInt * 100) / 100;
        const cssRoundedValue = cssValue.replace(cssValueInt.toString(), cssValueRoundedInt.toString());
        setComputedValue(cssRoundedValue);
      }
    };
    // Update computed value on mount
    updateComputedValue();

    // Update computed value on resize
    window.addEventListener("resize", updateComputedValue);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("resize", updateComputedValue);
    };
  }, [cssProperty, ref]);

  return computedValue;
};
