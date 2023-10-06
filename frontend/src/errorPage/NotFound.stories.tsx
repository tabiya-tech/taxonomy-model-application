import { Meta, StoryObj } from "@storybook/react";
import NotFound from "./NotFound";

const meta: Meta<typeof NotFound> = {
  title: "Application/NotFound",
  component: NotFound,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof NotFound>;

export const Shown: Story = {
  args: {},
};
