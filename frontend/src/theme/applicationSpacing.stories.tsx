import { Meta, StoryObj } from "@storybook/react";
import { Box, Typography, useTheme } from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { Theme } from "@mui/material/styles";
import { TabiyaSize } from "./theme";
import Paper from "@mui/material/Paper";
import { useRef } from "react";
import { useResponsiveStyleValue } from "src/utils/storybook";
import { TabiyaBaseSizes } from "./applicationTheme";

const meta: Meta = {
  title: "Style/Spacing",
  component: Box,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj;

interface SpacingAndRoundingElementsProps {
  theme: Theme;
}

interface SpacingAndRoundingElementProps extends SpacingAndRoundingElementsProps {
  value: number;
  size: keyof TabiyaSize;
  isFixed?: boolean;
}

const SpacingElement = (props: SpacingAndRoundingElementProps) => {
  const containerBox = useRef<HTMLDivElement>(null);
  const responsiveValue = useResponsiveStyleValue(containerBox, "padding");

  const spacing = props.theme.tabiyaSpacing[props.size];
  const padding = props.isFixed ? props.theme.fixedSpacing(spacing) : spacing;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "8rem",
        height: "8rem",
        backgroundColor: props.theme.palette.containerBackground.main,
        border: "0.5px solid",
        borderColor: props.theme.palette.secondary.main,
        position: "relative",
        padding: padding,
      }}
      ref={containerBox}
    >
      <Paper sx={{ width: "100%", height: "100%", borderRadius: (theme) => theme.tabiyaRounding.none }} />
      <Box
        sx={{
          position: "absolute",
          top: props.theme.responsiveBorderRounding(-1.5),
          right: "3px",
          backgroundColor: props.theme.palette.containerBackground.light,
          color: props.theme.palette.primary.main,
          padding: "0rem 0.5rem",
        }}
      >
        <Typography variant="body2">{`${props.size}: ${responsiveValue}`}</Typography>
      </Box>
      {props.value >= 2 && (
        <>
          <Box sx={{ position: "absolute", right: 0 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                position: "relative",
                width: responsiveValue,
              }}
            >
              <KeyboardArrowLeftIcon sx={{ height: "12px", position: "absolute", left: "-12px", top: "-5.64px" }} />
              <Box sx={{ width: "100%", borderTop: "0.5px solid" }}></Box>
              <KeyboardArrowRightIcon sx={{ height: "12px", position: "absolute", right: "-12px", top: "-5.64px" }} />
            </Box>
          </Box>
          <Box sx={{ position: "absolute", left: 0 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                position: "relative",
                width: responsiveValue,
              }}
            >
              <KeyboardArrowLeftIcon sx={{ height: "12px", position: "absolute", left: "-12px", top: "-5.64px" }} />
              <Box
                sx={{
                  width: "100%",
                  borderTop: `0.5px solid  ${props.theme.palette.primary.main}`,
                }}
              ></Box>
              <KeyboardArrowRightIcon sx={{ height: "12px", position: "absolute", right: "-11px", top: "-5.64px" }} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

const SpacingElements = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.tabiyaSpacing.md,
        paddingLeft: theme.tabiyaSpacing.lg,
      }}
    >
      <Typography variant={"h4"}>Spacing (padding and margin)</Typography>
      <Typography variant="caption">Theme spacing factor is {TabiyaBaseSizes.spacing}</Typography>
      <Typography variant={"subtitle1"}>Fixed Spacing</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.tabiyaSpacing.xl,
          columnGap: theme.tabiyaSpacing.lg,
        }}
      >
        {Object.entries(theme.tabiyaSpacing).map(([key, value]) => (
          <SpacingElement key={key} size={key as keyof TabiyaSize} value={value} theme={theme} isFixed />
        ))}
      </Box>

      <Typography variant={"subtitle1"}>Responsive Spacing</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.tabiyaSpacing.xl,
          columnGap: theme.tabiyaSpacing.lg,
        }}
      >
        {Object.entries(theme.tabiyaSpacing).map(([key, value]) => (
          <SpacingElement key={key} size={key as keyof TabiyaSize} value={value} theme={theme} />
        ))}
      </Box>
    </Box>
  );
};

export const SpacingStyles: Story = {
  args: {
    children: <SpacingElements />,
  },
};
