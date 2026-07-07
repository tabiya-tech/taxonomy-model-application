import type { Meta, StoryObj } from "@storybook/react";
import LandingPage from "./LandingPage";

const meta: Meta<typeof LandingPage> = {
  title: "Application/LandingPage",
  component: LandingPage,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof LandingPage>;

export const Shown: Story = {
  args: {},
};
