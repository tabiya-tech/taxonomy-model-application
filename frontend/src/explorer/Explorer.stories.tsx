import { Meta, StoryObj } from "@storybook/react";
import Explorer from "./Explorer";

const meta: Meta<typeof Explorer> = {
  title: "Explorer/Explorer",
  component: Explorer,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof Explorer>;

export const Shown: Story = {
  args: {},
};
