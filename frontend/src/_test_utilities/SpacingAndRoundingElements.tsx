import { Theme } from "@mui/material/styles";
import { TabiyaRounding, TabiyaSize } from "src/theme/theme";
import { useRef } from "react";
import { useResponsiveStyleValue } from "src/theme/applicationTheme/useResponsiveStyleValue";
import { Box, Typography, useTheme } from "@mui/material";
import Paper from "@mui/material/Paper";
import { TabiyaBaseSizes } from "src/theme/applicationTheme/applicationTheme";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

interface SpacingAndRoundingElementsProps {
  theme: Theme;
}

interface RoundingElementProps extends SpacingAndRoundingElementsProps {
  roundingSize: keyof TabiyaRounding;
  isFixed?: boolean;
}

const RoundingElement = (props: RoundingElementProps) => {
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
          {props.roundingSize}: {responsiveValue}
        </Typography>
      </Box>
    </Box>
  );
};

export const RoundingElements = () => {
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
        {Object.entries(theme.tabiyaRounding).map(([key]) => (
          <RoundingElement key={key} roundingSize={key as keyof TabiyaSize} isFixed theme={theme} />
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
        {Object.entries(theme.tabiyaRounding).map(([key]) => (
          <RoundingElement key={key} roundingSize={key as keyof TabiyaSize} theme={theme} />
        ))}
      </Box>
    </Box>
  );
};

interface SpacingElementProps extends SpacingAndRoundingElementsProps {
  value: number;
  spacingSize: keyof TabiyaSize;
  isFixed?: boolean;
}

const SpacingElement = (props: SpacingElementProps) => {
  const containerBox = useRef<HTMLDivElement>(null);
  const responsiveValue = useResponsiveStyleValue(containerBox, "padding");

  const spacing = props.theme.tabiyaSpacing[props.spacingSize];
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
        <Typography variant="body2">{`${props.spacingSize}: ${responsiveValue}`}</Typography>
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

export const SpacingElements = () => {
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
          <SpacingElement key={key} spacingSize={key as keyof TabiyaSize} value={value} theme={theme} isFixed />
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
          <SpacingElement key={key} spacingSize={key as keyof TabiyaSize} value={value} theme={theme} />
        ))}
      </Box>
    </Box>
  );
};
