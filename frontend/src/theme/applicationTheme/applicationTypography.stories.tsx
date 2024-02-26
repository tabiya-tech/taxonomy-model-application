import { Meta, StoryObj } from "@storybook/react";
import { Box, Theme, Typography, useTheme } from "@mui/material";
import { useRef } from "react";
import { useResponsiveStyleValue } from "src/theme/applicationTheme/useResponsiveStyleValue";
import { TabiyaBaseSizes } from "src/theme/applicationTheme/applicationTheme";

const meta: Meta = {
  title: "Style/Typography",
  component: Box,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj;

interface TypographyElementProps {
  theme: Theme;
  typographyKey: string;
}
const TypographyElement = (props: TypographyElementProps) => {
  const typographyRef = useRef<HTMLDivElement>(null);
  const computedFontSizeInPx = useResponsiveStyleValue(typographyRef, "font-size");
  const typographyObjectKey = props.typographyKey as keyof typeof props.theme.typography;
  const typographyVariant = props.theme.typography[typographyObjectKey];
  const computedFontSizeInRem = computedFontSizeInPx
    ? Math.round((parseFloat(computedFontSizeInPx) / TabiyaBaseSizes.font) * 100) / 100
    : "";
  if (
    typeof typographyVariant === "object" &&
    typographyVariant !== null &&
    "fontFamily" in typographyVariant &&
    "fontSize" in typographyVariant &&
    props.typographyKey !== "inherit"
  ) {
    return (
      <Typography variant={props.typographyKey as any} ref={typographyRef}>
        {`<${props.typographyKey}> ${typographyVariant.fontFamily} ${computedFontSizeInPx} = ${computedFontSizeInRem}rem`}
      </Typography>
    );
  }
  return null;
};
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
        {Object.keys(theme.typography as Record<string, any>).map((typographyKey: string) => (
          <TypographyElement key={typographyKey} typographyKey={typographyKey} theme={theme} />
        ))}
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

export const TypographyStyles: Story = {
  args: {
    children: <TypographyElements />,
  },
};
