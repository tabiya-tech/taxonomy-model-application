import "./application-theme.css";
import { Meta, StoryObj } from "@storybook/react";
import { Box, rgbToHex, Typography, useTheme, Icon } from "@mui/material";
import { Palette, PaletteColor, Theme } from "@mui/material/styles";
import { TabiyaSize } from "./theme";
import Paper from "@mui/material/Paper";
import { TabiyaIconStyles } from "./applicationTheme";
import SettingsIcon from "@mui/icons-material/Settings";

const meta: Meta = {
  title: "Components/Style",
  component: Box,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj;

const colorCategories = [
  "primary",
  "secondary",
  "error",
  "warning",
  "info",
  "success",
  "tabiyaYellow",
  "tabiyaGreen",
  "containerBackground",
] as const;
type ColorCategory = (typeof colorCategories)[number];

const TypographyElements = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        padding: theme.tabiyaSpacing.lg,
        gap: theme.tabiyaSpacing.lg,
      }}
    >
      <Typography variant={"h4"}>Basic Typography</Typography>
      <Box
        sx={{
          gap: theme.tabiyaSpacing.md,
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
        }}
      >
        {Object.keys(theme.typography as Record<string, any>).map((typographyKey: string) => {
          const typographyVariant = theme.typography[typographyKey as keyof typeof theme.typography];
          if (
            typeof typographyVariant === "object" &&
            typographyVariant !== null &&
            "fontFamily" in typographyVariant &&
            "fontSize" in typographyVariant &&
            typographyKey !== "inherit"
          ) {
            return (
              <Typography variant={typographyKey as any} key={typographyKey}>
                {`<${typographyKey}> ${typographyVariant.fontFamily} ${typographyVariant.fontSize}`}
              </Typography>
            );
          }
          return null;
        })}
      </Box>
      <Typography variant={"h4"}>Font Weight</Typography>
      <Box
        sx={{
          gap: theme.tabiyaSpacing.md,
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
        }}
      >
        <Typography sx={{ fontWeight: theme.typography.fontWeightBold }}>
          {`fontWeightBold: ${theme.typography.fontWeightBold}`}
        </Typography>
        <Typography sx={{ fontWeight: theme.typography.fontWeightMedium }}>
          {`fontWeightMedium: ${theme.typography.fontWeightMedium}`}
        </Typography>
        <Typography sx={{ fontWeight: theme.typography.fontWeightRegular }}>
          {`fontWeightRegular: ${theme.typography.fontWeightRegular}`}
        </Typography>
        <Typography sx={{ fontWeight: theme.typography.fontWeightLight }}>
          {`fontWeightLight: ${theme.typography.fontWeightLight}`}
        </Typography>
      </Box>
    </Box>
  );
};

const PaletteElements = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.tabiyaSpacing.lg,
      }}
    >
      <Typography variant={"h4"}> Basic Colors</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "start",
          padding: theme.tabiyaSpacing.lg,
          gap: theme.tabiyaSpacing.md,
        }}
      >
        {colorCategories.map((category) => (
          <Box
            key={category}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: theme.tabiyaSpacing.sm,
              gap: theme.tabiyaSpacing.md,
            }}
          >
            <Typography variant={"subtitle1"}>{category}</Typography>
            <Box>
              <ColorBox theme={theme} category={category} variant={"main"} />
              <ColorBox theme={theme} category={category} variant={"light"} />
              <ColorBox theme={theme} category={category} variant={"dark"} />
            </Box>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant={"h4"}>GreyScale</Typography>
        <Box sx={{ padding: theme.tabiyaSpacing.lg, gap: theme.tabiyaSpacing.md }}>
          {Object.entries(theme.palette.grey).map(([shade, color]) => (
            <ColorBox key={shade} shade={shade as keyof Palette["grey"]} theme={theme} color={color} />
          ))}
        </Box>
      </Box>
      <Box>
        <Typography variant={"h4"}>Text Colors</Typography>
        <Box sx={{ padding: theme.tabiyaSpacing.lg, gap: theme.tabiyaSpacing.md }}>
          {Object.entries(theme.palette.text).map(([variant, color]) => (
            <ColorBox
              theme={theme}
              color={variant === "textWhite" ? theme.palette.primary.main : theme.palette.common.white}
              key={variant}
            >
              <Typography variant={"subtitle1"} color={color}>
                {variant} : {color}
              </Typography>
            </ColorBox>
          ))}
        </Box>
      </Box>
      <Box>
        <Typography variant={"h4"}>Common Colors</Typography>
        <Box sx={{ padding: theme.tabiyaSpacing.lg, gap: theme.tabiyaSpacing.md }}>
          {Object.entries(theme.palette.common).map(([variant, color]) => (
            <ColorBox
              theme={theme}
              color={variant === "white" ? theme.palette.common.black : theme.palette.common.white}
              key={variant}
            >
              <Typography variant={"subtitle1"} color={color}>
                {variant} : {color}
              </Typography>
            </ColorBox>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const SpacingAndRoundingElements = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.tabiyaSpacing.md,
      }}
    >
      <SpacingElements theme={theme} />
      <RoundingElements theme={theme} />
    </Box>
  );
};

interface SpacingAndRoundingElementsProps {
  theme: Theme;
}

const SpacingElements = (props: SpacingAndRoundingElementsProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: props.theme.tabiyaSpacing.md,
      }}
    >
      <Typography variant={"h4"}>Spacing</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: props.theme.tabiyaSpacing.md,
        }}
      >
        {Object.entries(props.theme.tabiyaSpacing).map(([key, value]) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20rem",
              height: "20rem",
              backgroundColor: props.theme.palette.containerBackground.main,
              border: "2px solid",
              borderColor: props.theme.palette.secondary.main,
              position: "relative",
            }}
          >
            <Box
              sx={{
                margin: props.theme.tabiyaSpacing[key as keyof TabiyaSize],
              }}
            >
              <Paper
                sx={{
                  height: "10rem",
                  padding: props.theme.tabiyaSpacing.md,
                }}
              >
                <Typography variant={"subtitle1"}>
                  With margin: props.theme.tabiyaSpacing.
                  {key as keyof TabiyaSize}
                </Typography>
              </Paper>
            </Box>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                backgroundColor: props.theme.palette.primary.main,
                color: props.theme.palette.primary.contrastText,
                padding: "0.5rem",
              }}
            >
              {`${key}: ${value} * ${props.theme.spacing(1)}`}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const RoundingElements = (props: SpacingAndRoundingElementsProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: props.theme.tabiyaSpacing.md,
      }}
    >
      <Typography variant={"h4"}>Rounding</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: props.theme.tabiyaSpacing.md,
        }}
      >
        {Object.entries(props.theme.tabiyaRounding).map(([key, value]) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "12rem",
              height: "12rem",
              backgroundColor: props.theme.palette.containerBackground.main,
              border: "2px solid",
              borderColor: props.theme.palette.secondary.main,
              position: "relative",
            }}
          >
            <Paper
              sx={{
                width: "10rem",
                height: "10rem",
                borderRadius: value,
              }}
            ></Paper>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                backgroundColor: props.theme.palette.primary.main,
                color: props.theme.palette.primary.contrastText,
                padding: "0.5rem",
              }}
            >
              {`${key}: ${value} ${key !== "full" ? "*" + props.theme.spacing(1) : ""}`}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

interface ColorBoxProps {
  theme: Theme;
  category?: ColorCategory;
  variant?: keyof PaletteColor;
  color?: string;
  shade?: keyof Palette["grey"];
  children?: any;
}

const ColorBox = (props: ColorBoxProps) => {
  let color: string;
  let contrastText: string;

  if (props.color) {
    color = rgbToHex(props.color);
    contrastText = props.theme.palette.getContrastText(color);
  } else if (props.category && props.variant) {
    color = rgbToHex(props.theme.palette[props.category][props.variant]);
    contrastText = props.theme.palette.getContrastText(color);
  } else if (props.shade) {
    color = rgbToHex(props.theme.palette.grey[props.shade]);
    contrastText = props.theme.palette.getContrastText(color);
  } else {
    throw new Error("Invalid props provided to ColorBox");
  }

  return (
    <Box
      sx={{
        height: "4rem",
        width: "16rem",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "start",
        padding: props.theme.tabiyaSpacing.md,
      }}
    >
      <Typography fontWeight={"bold"} color={contrastText}>
        {props.children ? props.children : props.variant ?? props.shade ?? color}
      </Typography>
    </Box>
  );
};

const IconsElements = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.tabiyaSpacing.md,
      }}
    >
      <MuiSvgIconsElements theme={theme} />
      <MuiIconsElements theme={theme} />
    </Box>
  );
};

interface IconsElementsProps {
  theme: Theme;
}

const iconTitles: Record<string, string> = {
  fontSizeSmall: "Small",
  fontSizeMedium: "Medium(Default)",
  fontSizeLarge: "Large",
  root: "Fallback",
};

const MuiSvgIconsElements = (props: IconsElementsProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: props.theme.tabiyaSpacing.md,
      }}
    >
      <Typography variant={"h4"}>Mui Svg Icons</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: props.theme.tabiyaSpacing.md,
        }}
      >
        {Object.entries(TabiyaIconStyles).map(([key, value]) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: props.theme.tabiyaSpacing.sm,
            }}
          >
            <Typography variant="subtitle1">{iconTitles[key]}</Typography>
            <Typography variant="subtitle2">{`${value.fontSize}(${parseFloat(value.fontSize) * 16}px)`}</Typography>
            <SettingsIcon sx={{ fontSize: value }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const MuiIconsElements = (props: IconsElementsProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: props.theme.tabiyaSpacing.md,
      }}
    >
      <Typography variant={"h4"}>Mui Icons</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: props.theme.tabiyaSpacing.md,
        }}
      >
        {Object.entries(TabiyaIconStyles).map(([key, value]) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: props.theme.tabiyaSpacing.sm,
            }}
          >
            <Typography variant="subtitle1">{iconTitles[key]}</Typography>
            <Typography variant="subtitle2">{`${value.fontSize} (${parseFloat(value.fontSize) * 16}px)`}</Typography>
            <Icon sx={{ fontSize: value }}>home</Icon>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const TypographyStyles: Story = {
  args: {
    children: <TypographyElements />,
  },
};

export const PaletteStyles: Story = {
  args: {
    children: <PaletteElements />,
  },
};

export const SpacingAndRoundingStyles: Story = {
  args: {
    children: <SpacingAndRoundingElements />,
  },
};

export const IconsStyles: Story = {
  args: {
    children: <IconsElements />,
  },
};
