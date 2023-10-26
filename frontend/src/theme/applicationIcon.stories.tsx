import { Meta, StoryObj } from "@storybook/react";
import { Box, Typography, useTheme, Icon } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { TabiyaIconStyles } from "./applicationTheme";
import SettingsIcon from "@mui/icons-material/Settings";

const meta: Meta = {
  title: "Style/Icons",
  component: Box,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj;

interface IconsElementsProps {
  theme: Theme;
  isSvg?: boolean;
}

const iconTitles: Record<string, string> = {
  fontSizeSmall: "Small",
  fontSizeMedium: "Medium(Default)",
  fontSizeLarge: "Large",
  root: "Fallback",
};

// Sorts the keys of an object by the fontSize value
const getSortedKeys = (obj: Record<string, any>) =>
  Object.entries(obj).sort(
    ([_key, value], [_key2, value2]) => parseFloat(value.fontSize) - parseFloat(value2.fontSize)
  );

const IconElements = (props: IconsElementsProps) => {
  const title = props.isSvg ? "Mui Svg Icons" : "Mui Icons";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: props.theme.tabiyaSpacing.md,
      }}
    >
      <Typography variant={"h4"}>{title}</Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "end",
          flexWrap: "wrap",
          gap: props.theme.tabiyaSpacing.md,
        }}
      >
        {getSortedKeys(TabiyaIconStyles).map(([key, value]) => (
          <Box
            key={key}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: props.theme.tabiyaSpacing.sm,
            }}
          >
            {
              // Render the icon as an svg if the isSvg prop is true
              props.isSvg ? <SettingsIcon sx={{ fontSize: value }} /> : <Icon sx={{ fontSize: value }}>home</Icon>
            }

            <Typography variant="caption" lineHeight="0" color="secondary">
              {iconTitles[key]}
            </Typography>
            <Typography variant="caption" color="secondary">
              {`${value.fontSize} (${parseFloat(value.fontSize) * 16}px)`}
            </Typography>
          </Box>
        ))}
      </Box>
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
        padding: theme.tabiyaSpacing.lg,
      }}
    >
      <IconElements theme={theme} />
      <IconElements theme={theme} isSvg />
    </Box>
  );
};
export const IconsStyles: Story = {
  args: {
    children: <IconsElements />,
  },
};
