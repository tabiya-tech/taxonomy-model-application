import "@mui/material/styles";
import { PaletteColor, PaletteColorOptions } from "@mui/material/styles";

// Definitions for custom theme configurations
type TabiyaSizeKeys = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type TabiyaSize = Record<TabiyaSizeKeys, number>;

interface TabiyaRounding extends TabiyaSize {
  full: "50%"; // e.g., '100%'
}

// Augment MUI theme with custom properties
declare module "@mui/material/styles" {
  interface CustomThemeConfig {
    /**
     * Defines spacing values that can be used for layout (e.g. padding, margins, etc.).
     * @example
     * <Box sx: {{ paddingY: (theme) => theme.tabiyaSpacing.xs }} >
     *
     * @example
     * const theme = useTheme();
     * <Box paddingY={theme.tabiyaSpacing.xs}>
     **/
    tabiyaSpacing: TabiyaSize;

    /**
     * Defines rounding values that can be used for elements (e.g., borderRadius).
     * @example
     * <Box sx: {{ borderRadius: (theme) => theme.tabiyaRounding.xs }} >
     *
     * @example
     * const theme = useTheme();
     * <Box borderRadius={theme.tabiyaRounding.xs} >
     **/
    tabiyaRounding: TabiyaRounding;

    /**
     * Generates a fixed (non-responsive) spacing value based on the factor provided.
     * @param factor
     * The factor to multiply the base spacing by.
     * @returns
     * A CSS string representing the fixed (non-responsive) spacing value.
     * @example
     * // Usage in a component's style object:
     * <Box sx={{ paddingY: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.xs) }} >
     */
    fixedSpacing: (factor: number) => string;

    /**
     * Generates a fixed (non-responsive) rounding value based on the factor provided.
     * @param factor
     * The factor to multiply the base rounding by.
     * @returns
     * A CSS string representing the fixed (non-responsive) rounding value.
     * @example
     * // Usage in a component's style object:
     * <Box sx={{ borderRadius: (theme) => theme.rounding(theme.tabiyaRounding.xs) }} >
     */
    rounding: (factor: number | "50%") => string;

    /**
     * Generates a responsive rounding value based on the factor provided.
     * @param factor
     * The factor to multiply the base rounding by.
     * @returns
     * A CSS string representing the responsive border rounding value.
     * @example
     * // Usage in a component's style object:
     * <Box sx={{ borderRadius: (theme) => theme.responsiveBorderRounding(theme.tabiyaRounding.xs) }} />
     */
    responsiveBorderRounding: (factor: number | "50%") => string;
  }

  interface Theme extends CustomThemeConfig {}

  interface ThemeOptions extends CustomThemeConfig {}
}

declare module "@mui/material/styles" {
  interface Palette {
    containerBackground: PaletteColor;
    tabiyaGreen: PaletteColor;
    tabiyaYellow: PaletteColor;
    text: TypeText;
  }

  interface TypeText {
    textWhite: string;
    textBlack: string;
    textAccent: string;
  }

  interface PaletteOptions {
    containerBackground?: PaletteColorOptions;
    tabiyaGreen?: PaletteColorOptions;
    tabiyaYellow?: PaletteColorOptions;
  }
}
