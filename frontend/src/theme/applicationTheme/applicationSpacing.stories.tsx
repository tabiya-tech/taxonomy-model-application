import { Meta, StoryObj } from "@storybook/react";
import { SpacingElements } from "src/_test_utilities/SpacingAndRoundingElements";

const meta: Meta = {
  title: "Style/Spacing",
  component: SpacingElements,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj;

export const SpacingStyles: Story = {
  args: {
    children: <SpacingElements />,
  },
};
