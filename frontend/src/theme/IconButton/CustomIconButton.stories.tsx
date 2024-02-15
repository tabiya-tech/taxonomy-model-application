import CustomIconButton from "./CustomIconButton";
import { Meta, StoryObj } from "@storybook/react";
import { ContentCopy } from "@mui/icons-material";
import React from "react";
import Box from "@mui/material/Box";

const meta: Meta<typeof CustomIconButton> = {
  title: "Components/CustomIconButton",
  component: CustomIconButton,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CustomIconButton>;

export const Shown: Story = {
  args: {
    children: (
      <Box sx={{ padding: "5px" }}>
        <ContentCopy />
      </Box>
    ),
    title: "Copy to clipboard",
  },
};
