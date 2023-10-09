import { createTheme, Palette, PaletteColor, PaletteColorOptions, ThemeOptions } from "@mui/material/styles";

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
    containerBackground: PaletteColorOptions;
  }
}

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
}

const _temp_palette = createTheme().palette;

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

const lightPalette: Palette = {
  ..._temp_palette,
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

const darkPalette: any = {
  // TODO: Add Some dark theme palette options
};

export const applicationTheme = (theme: ThemeMode) => {
  const activePalette = theme === ThemeMode.LIGHT ? lightPalette : darkPalette;
  const activeTheme: ThemeOptions = {
    palette: activePalette,
    spacing: 8,
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
      htmlFontSize: 16, // Set the base font size
      fontFamily: "Inter, sans-serif", // Set the desired font family
      fontSize: 16, // Set the base font size
      h1: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: "2rem",
        color: activePalette.text.primary,
      },
      h2: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: "1.85rem",
        color: activePalette.text.primary,
      },
      h3: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: "1.7rem",
        color: activePalette.text.primary,
      },
      h4: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: "1.55rem",
        color: activePalette.text.primary,
      },
      h5: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: "1.4rem",
        color: activePalette.text.primary,
      },
      h6: {
        fontFamily: "IBM Plex Mono",
        fontWeight: "700",
        fontSize: "1.25rem",
        color: activePalette.text.primary,
      },
      subtitle1: {
        fontFamily: "Inter",
        fontWeight: "500",
        fontSize: "1rem",
        color: activePalette.text.textAccent,
      },
      subtitle2: {
        fontFamily: "Inter",
        fontWeight: "500",
        fontSize: "0.875rem",
        color: activePalette.text.textAccent,
      },
      body1: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: "1rem",
        color: activePalette.text.secondary,
      },
      body2: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: "0.875rem",
        color: activePalette.text.secondary,
      },
      button: {
        fontFamily: "Inter",
        fontWeight: "500",
        fontSize: "1rem",
        color: activePalette.text.primary,
        textTransform: "none",
      },
      caption: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: "0.75rem",
      },
      overline: {
        fontFamily: "Inter",
        fontWeight: "400",
        fontSize: "0.75rem",
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
            color: activePalette.error.main,
          },
        },
      },
      MuiInput: {
        styleOverrides: {
          input: {
            "::placeholder": {
              color: activePalette.text.secondary,
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiTableHead: {
        defaultProps: {
          style: {
            background: activePalette.containerBackground.main,
          },
        },
      },
    },
  };
  return createTheme(activeTheme);
};

export default applicationTheme;
