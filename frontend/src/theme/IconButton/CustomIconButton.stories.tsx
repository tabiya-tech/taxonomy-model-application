import CustomIconButton from "./CustomIconButton";
import { Meta, StoryObj } from "@storybook/react";
import { ContentCopy } from "@mui/icons-material";
import React from "react";

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
    icon: <ContentCopy />,
    disabled: false,
    ariaLabel: "copy",
  },
};
