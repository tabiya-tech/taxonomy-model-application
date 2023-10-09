import { Meta, StoryObj } from "@storybook/react";
import AppHeader from "./AppHeader";

const meta: Meta<typeof AppHeader> = {
  title: "Application/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof AppHeader>;

export const Shown: Story = {
  args: {},
};
