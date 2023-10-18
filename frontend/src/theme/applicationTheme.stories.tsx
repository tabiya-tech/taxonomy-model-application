import "./application-theme.css";
import { Meta, StoryObj } from "@storybook/react";
import { Box, rgbToHex, Typography, useTheme, Icon } from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
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

const groupedColorCategories = [
  ["primary", "secondary"],
  ["error", "warning", "info", "success"],
  ["tabiyaYellow", "tabiyaGreen"],
  ["containerBackground"],
] as const;
const colorCategories = groupedColorCategories.flat();
type ColorCategory = (typeof colorCategories)[number];

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
          flexDirection: "column",
          gap: theme.tabiyaSpacing.md,
          paddingLeft: theme.tabiyaSpacing.lg,
        }}
      >
        {groupedColorCategories.map((categories) => (
          <Box
            key={categories.join("_")}
            sx={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "start",
              gap: theme.tabiyaSpacing.lg,
            }}
          >
            {categories.map((category) => (
              <Box
                key={category}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: theme.tabiyaSpacing.lg,
                }}
              >
                <Typography alignSelf="flex-start" variant={"subtitle1"}>
                  {category}
                </Typography>
                <Box>
                  <ColorBox theme={theme} category={category} variant={"main"} />
                  <ColorBox theme={theme} category={category} variant={"light"} />
                  <ColorBox theme={theme} category={category} variant={"dark"} />
                </Box>
              </Box>
            ))}
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
        paddingLeft: props.theme.tabiyaSpacing.lg,
      }}
    >
      <Typography variant={"h4"}>Spacing</Typography>
      <Typography variant={"subtitle1"}>Spacing (padding and margin) @mu base is 8px</Typography>
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
              width: "10rem",
              height: "10rem",
              backgroundColor: props.theme.palette.containerBackground.main,
              border: "0.5px solid",
              borderColor: props.theme.palette.secondary.main,
              position: "relative",
              padding: props.theme.tabiyaSpacing[key as keyof TabiyaSize],
            }}
          >
            <Paper sx={{ width: "100%", height: "100%", borderRadius: 0 }} />
            <Box
              sx={{
                position: "absolute",
                top: "-15px",
                right: "3px",
                backgroundColor: props.theme.palette.containerBackground.light,
                color: props.theme.palette.primary.main,
                padding: "0rem 0.5rem",
              }}
            >
              {`${key}: ${props.theme.spacing(value)}`}
            </Box>
            {value >= 2 && (
              <>
                <Box sx={{ position: "absolute", right: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      position: "relative",
                      width: props.theme.spacing(value),
                    }}
                  >
                    <KeyboardArrowLeftIcon
                      sx={{ height: "12px", position: "absolute", left: "-12px", top: "-5.64px" }}
                    />
                    <Box sx={{ width: "100%", borderTop: "0.5px solid" }}></Box>
                    <KeyboardArrowRightIcon
                      sx={{ height: "12px", position: "absolute", right: "-12px", top: "-5.64px" }}
                    />
                  </Box>
                </Box>
                <Box sx={{ position: "absolute", left: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      position: "relative",
                      width: props.theme.spacing(value),
                    }}
                  >
                    <KeyboardArrowLeftIcon
                      sx={{ height: "12px", position: "absolute", left: "-12px", top: "-5.64px" }}
                    />
                    <Box sx={{ width: "100%", borderTop: `0.5px solid  ${props.theme.palette.primary.main}` }}></Box>
                    <KeyboardArrowRightIcon
                      sx={{ height: "12px", position: "absolute", right: "-11px", top: "-5.64px" }}
                    />
                  </Box>
                </Box>
              </>
            )}
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
        paddingLeft: props.theme.tabiyaSpacing.lg,
      }}
    >
      <Typography variant={"h4"}>Rounding</Typography>
      <Typography variant={"subtitle1"}>Rounding (border-radius) @mu base is 8px</Typography>
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
              width: "10rem",
              height: "10rem",
              backgroundColor: props.theme.palette.containerBackground.main,
              border: "0.5px solid",
              borderColor: props.theme.palette.secondary.main,
              position: "relative",
            }}
          >
            <Paper
              sx={{
                width: "8rem",
                height: "8rem",
                borderRadius: value,
              }}
            ></Paper>
            <Box
              sx={{
                position: "absolute",
                top: "-15px",
                right: "3px",
                backgroundColor: props.theme.palette.containerBackground.light,
                color: props.theme.palette.primary.main,
                padding: "0rem 0.5rem",
              }}
            >
              {`${key}: ${typeof value === "number" ? `${value * props.theme.shape.borderRadius}px` : value}`}
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
        height: "2.5rem",
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
