import "@mui/material/styles";

// Definitions for custom theme configurations
type TabiyaSizeKeys = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type TabiyaSize = Record<TabiyaSizeKeys, number>;

interface TabiyaRounding extends TabiyaSize {
  full: string; // e.g., '100%'
}

// Augment MUI theme with custom properties
declare module "@mui/material/styles" {
  interface CustomThemeConfig {
    /**
     * @example
     * <Box sx: {{ paddingY: tabiyaSpacing.xs }} > // calculated as theme.spacing * theme.tabiyaSpacing.xs
     *
     * @example
     * <Box paddingY={theme.tabiyaSpacing.xs}> // calculated as theme.spacing * theme.tabiyaSpacing.xs
     **/
    tabiyaSpacing: TabiyaSize;

    /**
     * @example
     * <Box sx: {{ borderRadius: tabiyaRounding.xs }} > // calculated as theme.shape.borderRadius * theme.tabiyaRounding.xs
     *
     * @example
     * <Box borderRadius={theme.tabiyaRounding.xs} > // calculated as theme.shape.borderRadius * theme.tabiyaRounding.xs
     **/
    tabiyaRounding: TabiyaRounding;
  }

  interface Theme extends CustomThemeConfig {}

  interface ThemeOptions extends CustomThemeConfig {}
}
