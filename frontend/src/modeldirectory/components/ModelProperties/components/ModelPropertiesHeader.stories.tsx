import ModelPropertiesHeader from "./ModelPropertiesHeader";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ModelPropertiesHeader> = {
  title: "ModelDirectory/ModelPropertiesHeader",
  component: ModelPropertiesHeader,
  tags: ["autodocs"],
  argTypes: { notifyOnClose: { action: "notifyOnClose" } },
};

export default meta;

type Story = StoryObj<typeof ModelPropertiesHeader>;

export const Shown: Story = {
  args: {
    title: "Model Properties",
  },
};
