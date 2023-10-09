import type { Meta, StoryObj } from "@storybook/react";

import ImportFilesSelection from "./ImportFilesSelection";

const meta: Meta<typeof ImportFilesSelection> = {
  title: "Import/ImportFilesSelection",
  component: ImportFilesSelection,
  tags: ["autodocs"],
  argTypes: { notifySelectedFileChange: { action: "notifySelectedFileChange" } },
};

export default meta;
type Story = StoryObj<typeof ImportFilesSelection>;

export const Shown: Story = {
  args: {},
};
