import type { Meta, StoryObj } from "@storybook/react";

import ImportModelDialog from "./ImportModelDialog";

const meta: Meta<typeof ImportModelDialog> = {
  title: "Import/ImportModelDialog",
  component: ImportModelDialog,
  tags: ["autodocs"],
  argTypes: { notifyOnClose: { action: "notifyOnClose" } },
};

export default meta;
type Story = StoryObj<typeof ImportModelDialog>;

export const Shown: Story = {
  args: {
    isOpen: true,
    availableLocales: [
      {
        name: "South Africa",
        shortCode: "ZA",
        UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a",
      },
      {
        name: "Ethiopia",
        shortCode: "ETH",
        UUID: "1df3d395-2a3d-4334-8fec-9d990bc8e3e4",
      },
    ],
  },
};
