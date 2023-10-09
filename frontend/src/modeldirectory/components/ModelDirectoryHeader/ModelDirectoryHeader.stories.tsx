import { Meta, StoryObj } from "@storybook/react";
import ModelDirectoryHeader from "./ModelDirectoryHeader";

const meta: Meta<typeof ModelDirectoryHeader> = {
  title: "ModelDirectory/ModelDirectoryHeader",
  component: ModelDirectoryHeader,
  tags: ["autodocs"],
  argTypes: { onModelImport: { action: "onModelImport" } },
};

export default meta;

type Story = StoryObj<typeof ModelDirectoryHeader>;

export const Shown: Story = {
  args: {},
};
