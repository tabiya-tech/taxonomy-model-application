import type { Meta, StoryObj } from "@storybook/react";
import { Backdrop } from "./Backdrop";

const meta: Meta<typeof Backdrop> = {
  title: "Components/Backdrop",
  component: Backdrop,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Backdrop>;

export const ShownWithMessage: Story = {
  args: { isShown: true, message: "Something will take time to complete. Please wait..." },
};

export const ShownWithoutMessage: Story = {
  args: { isShown: true },
};
