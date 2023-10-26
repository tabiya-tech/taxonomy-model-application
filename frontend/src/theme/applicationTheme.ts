import { createTheme, PaletteOptions, ThemeOptions, SimplePaletteColorOptions } from "@mui/material/styles/";
import { CSSClampFnCalculatorPx, CSSClampFnCalculatorRem, ScreenSize } from "src/utils/CSSClampFnCalculator";

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
}

// @ts-ignore
const _temp_palette = createTheme({
  palette: {
    contrastThreshold: 4.5, //WCAG 2.0 (AA) ensure color-contrast is at least 4.5:1
  },
}).palette;

const augmentedThemeColor = (color: string, contrastColor?: string) =>
  _temp_palette.augmentColor({
    color: {
      main: color,
      contrastText: contrastColor,
    },
  });

const TabiyaBasicColors = {
  DarkBlue: "#002147",
  LightBlue: "#265EA7",
  Yellow: "#EEFF41",
  Green: "#00FF91",
  Gray: "#F3F1EE",
  GrayDark: "#43474E",
};
export const TabiyaIconStyles = {
  fontSizeSmall: {
    fontSize: "1rem",
  },
  fontSizeMedium: {
    fontSize: "1.5rem",
  },
  fontSizeLarge: {
    fontSize: "2.5rem",
  },
  root: {
    fontSize: "1.5rem",
  },
};

const lightPalette: PaletteOptions = {
  contrastThreshold: 4.5, // WCAG 2.0 (AA) ensure color-contrast is at least 4.5:1
  primary: augmentedThemeColor(TabiyaBasicColors.DarkBlue),
  secondary: augmentedThemeColor(TabiyaBasicColors.LightBlue),
  tabiyaYellow: augmentedThemeColor(TabiyaBasicColors.Yellow),
  tabiyaGreen: augmentedThemeColor(TabiyaBasicColors.Green),
  containerBackground: {
    light: "#FFFFFF",
    dark: "#DFDDD9",
    main: TabiyaBasicColors.Gray,
    contrastText: TabiyaBasicColors.GrayDark,
  },
  error: { ...augmentedThemeColor("#FF5449"), dark: "#690005", light: "#FFEDEA" },
  warning: { ...augmentedThemeColor("#FDAB40", TabiyaBasicColors.GrayDark), dark: "#B84204", light: "#FFF3E0" },
  info: { ...augmentedThemeColor("#4FC3F7"), dark: "#003662", light: "#CAF5FF" },
  success: { ...augmentedThemeColor("#6BF0AE"), dark: "#1D6023", light: "#E8F5E9" },
  grey: {
    900: "#211F1D",
    800: "#41403D",
    700: "#605E5B",
    600: "#74726F",
    500: "#9D9B98",
    400: "#BBB9B5",
    300: "#DFDDD9",
    200: "#EDEBE8",
    100: TabiyaBasicColors.Gray,
    50: "#F8F6F3",
    A100: "#F0F3EE",
    A200: "#D9F5D3",
    A400: "#C6F7A4",
    A700: "#CAF09D",
  },
  text: {
    primary: TabiyaBasicColors.DarkBlue,
    secondary: TabiyaBasicColors.GrayDark,
    textAccent: TabiyaBasicColors.LightBlue,
    textWhite: "#FFFFFF",
    textBlack: "#000000",
    disabled: "#E0E2EC",
  },
  common: {
    white: "#ffffff",
    black: "#000000",
  },
};

const darkPalette: PaletteOptions = {
  // Add Some dark theme palette options,
  // currently using the light theme palette
  ...lightPalette,
};

export const TabiyaBaseSizes = {
  // All sizes are in px
  spacing: 8,
  rounding: 8,
  font: 16,
};
export const applicationTheme = (theme: ThemeMode) => {
  const screenSizePx: ScreenSize = {
    minWidth: 800,
    maxWidth: 1200,
    minHeight: 500,
    maxHeight: 800,
  };
  const screenSizeRem: ScreenSize = {
    minWidth: screenSizePx.minWidth / TabiyaBaseSizes.font,
    maxWidth: screenSizePx.maxWidth / TabiyaBaseSizes.font,
    minHeight: screenSizePx.minHeight / TabiyaBaseSizes.font,
    maxHeight: screenSizePx.maxHeight / TabiyaBaseSizes.font,
  };

  // cache the clamp functions to avoid recalculating them
  const spacingClampFn = CSSClampFnCalculatorPx(TabiyaBaseSizes.spacing / 4, TabiyaBaseSizes.spacing, screenSizePx);
  const roundingClampFn = CSSClampFnCalculatorPx(TabiyaBaseSizes.rounding / 4, TabiyaBaseSizes.rounding, screenSizePx);

  const activePalette: PaletteOptions = theme === ThemeMode.LIGHT ? lightPalette : darkPalette;
  const activeTheme: ThemeOptions = {
    palette: activePalette,
    spacing: (factor: number) => `calc(${spacingClampFn} * ${factor})`,
    fixedSpacing: (factor: number) => `${factor * TabiyaBaseSizes.spacing}px`,
    responsiveBorderRounding: (factor: number | "50%") => {
      if (factor === "50%") {
        // percentage makes no sense to be responsive
        return factor;
      }
      return `calc(${roundingClampFn} * ${factor})`;
    },
    rounding: (factor: number | "50%") => {
      if (factor === "50%") {
        // percentage makes no sense to multiply with factor
        return factor;
      }
      return `${factor * TabiyaBaseSizes.rounding}px`;
    },
    tabiyaSpacing: {
      none: 0,
      xs: 0.5,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
    },
    shape: {
      borderRadius: 8,
    },
    tabiyaRounding: {
      none: 0,
      xs: 0.5,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      full: "50%",
    },
    typography: {
      htmlFontSize: TabiyaBaseSizes.font, // Set the base font size
      fontFamily: "Inter, sans-serif", // Set the desired font family
      // @ts-ignore
      fontSize: TabiyaBaseSizes.font, // Set the base font size
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: CSSClampFnCalculatorRem(1.3, 2, screenSizeRem),
        color: activePalette.text!!.primary,
      },
      h2: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: CSSClampFnCalculatorRem(1.25, 1.85, screenSizeRem),
        color: activePalette.text!!.primary,
      },
      h3: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: CSSClampFnCalculatorRem(1.2, 1.7, screenSizeRem),
        color: activePalette.text!!.primary,
      },
      h4: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: CSSClampFnCalculatorRem(1.15, 1.55, screenSizeRem),
        color: activePalette.text!!.primary,
      },
      h5: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: CSSClampFnCalculatorRem(1.1, 1.4, screenSizeRem),
        color: activePalette.text!!.primary,
      },
      h6: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: CSSClampFnCalculatorRem(1, 1.25, screenSizeRem),
        color: activePalette.text!!.primary,
      },
      subtitle1: {
        fontFamily: "Inter",
        fontWeight: "500",
        fontSize: CSSClampFnCalculatorRem(0.75, 1, screenSizeRem),
        color: activePalette.text!!.textAccent,
      },
      subtitle2: {
        fontFamily: "Inter",
        fontWeight: "500",
        fontSize: CSSClampFnCalculatorRem(0.5, 0.875, screenSizeRem),
        color: activePalette.text!!.textAccent,
      },
      body1: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: CSSClampFnCalculatorRem(0.75, 1, screenSizeRem),
        color: activePalette.text!!.secondary,
      },
      body2: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: CSSClampFnCalculatorRem(0.5, 0.875, screenSizeRem),
        color: activePalette.text!!.secondary,
      },
      button: {
        fontFamily: "Inter",
        fontWeight: "500",
        fontSize: CSSClampFnCalculatorRem(0.75, 1, screenSizeRem),
        color: activePalette.text!!.primary,
        textTransform: "none",
      },
      caption: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: CSSClampFnCalculatorRem(0.5, 0.75, screenSizeRem),
      },
      overline: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: CSSClampFnCalculatorRem(0.5, 0.75, screenSizeRem),
      },
    },
    components: {
      MuiDialogTitle: {
        defaultProps: {
          variant: "h2",
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          asterisk: {
            color: (activePalette.error as SimplePaletteColorOptions).main, // unclear why typescript complaints about this and we need to cast
          },
        },
      },
      MuiInput: {
        styleOverrides: {
          input: {
            "::placeholder": {
              color: activePalette.text!!.secondary,
            },
          },
        },
      },
      MuiTableHead: {
        defaultProps: {
          style: {
            background: (activePalette.containerBackground as SimplePaletteColorOptions)!!.main,
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          ...TabiyaIconStyles,
        },
      },
      MuiIcon: {
        styleOverrides: {
          ...TabiyaIconStyles,
        },
      },
    },
  };
  return createTheme(activeTheme);
};

export default applicationTheme;
