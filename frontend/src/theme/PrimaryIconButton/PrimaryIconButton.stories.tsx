import PrimaryIconButton from "./PrimaryIconButton";
import { Meta, StoryObj } from "@storybook/react";
import { ContentCopy } from "@mui/icons-material";
import React from "react";
import Box from "@mui/material/Box";

const meta: Meta<typeof PrimaryIconButton> = {
  title: "Components/PrimaryIconButton",
  component: PrimaryIconButton,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof PrimaryIconButton>;

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
