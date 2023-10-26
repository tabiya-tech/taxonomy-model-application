import { Meta, StoryObj } from "@storybook/react";
import { Box, Typography, useTheme } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { TabiyaRounding, TabiyaSize } from "./theme";
import Paper from "@mui/material/Paper";
import { useRef } from "react";
import { useResponsiveStyleValue } from "src/utils/storybook";
import { TabiyaBaseSizes } from "./applicationTheme";

const meta: Meta = {
  title: "Style/Rounding",
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
  roundingSize: keyof TabiyaRounding;
  isFixed?: boolean;
}

const RoundingElement = (props: SpacingAndRoundingElementProps) => {
  const roundedElement = useRef<HTMLDivElement>(null);
  const responsiveValue = useResponsiveStyleValue(roundedElement, "border-radius");

  const rounding = props.theme.tabiyaRounding[props.roundingSize];
  const borderRadius = props.isFixed ? rounding : props.theme.responsiveBorderRounding(rounding);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "7rem",
        height: "7rem",
        backgroundColor: props.theme.palette.containerBackground.main,
        border: "0.5px solid",
        borderColor: props.theme.palette.secondary.main,
        position: "relative",
      }}
    >
      <Paper
        sx={{
          width: "5rem",
          height: "5rem",
          borderRadius: borderRadius,
        }}
        ref={roundedElement}
      ></Paper>
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
        <Typography variant="body2">
          {`${props.roundingSize}: ${typeof props.value === "number" ? `${responsiveValue}` : props.value}`}
        </Typography>
      </Box>
    </Box>
  );
};

const RoundingElements = () => {
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
      <Typography variant={"h4"}>Rounding (border-radius)</Typography>
      <Typography variant="caption">Theme rounding factor is {TabiyaBaseSizes.rounding}</Typography>
      <Typography variant={"subtitle1"}>Fixed Rounding</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.tabiyaSpacing.xl,
          columnGap: theme.tabiyaSpacing.lg,
        }}
      >
        {Object.entries(theme.tabiyaRounding).map(([key, value]) => (
          <RoundingElement key={key} roundingSize={key as keyof TabiyaSize} value={value} isFixed theme={theme} />
        ))}
      </Box>
      <Typography variant={"subtitle1"}>Responsive Rounding</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.tabiyaSpacing.xl,
          columnGap: theme.tabiyaSpacing.lg,
        }}
      >
        {Object.entries(theme.tabiyaRounding).map(([key, value]) => (
          <RoundingElement key={key} roundingSize={key as keyof TabiyaSize} value={value} theme={theme} />
        ))}
      </Box>
    </Box>
  );
};

export const RoundingStyles: Story = {
  args: {
    children: <RoundingElements />,
  },
};
