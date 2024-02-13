import ModelPropertiesHeader from "./ModelPropertiesHeader";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ModelPropertiesHeader> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesHeader",
  component: ModelPropertiesHeader,
  tags: ["autodocs"],
  argTypes: { notifyOnClose: { action: "notifyOnClose" } },
};

export default meta;

type Story = StoryObj<typeof ModelPropertiesHeader>;

export const Shown: Story = {
  args: {
    name: "Model Properties",
  },
};
