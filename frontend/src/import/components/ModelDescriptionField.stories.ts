import type { Meta, StoryObj } from "@storybook/react";
import { ModelDescriptionField } from "./ModelDescriptionField";

const meta: Meta<typeof ModelDescriptionField> = {
  title: "Import/ModelDescriptionField",
  component: ModelDescriptionField,
  tags: ["autodocs"],
  argTypes: { notifyModelDescriptionChanged: { action: "notifyModelDescriptionChanged" } },
};

export default meta;
type Story = StoryObj<typeof ModelDescriptionField>;

export const ComponentRendered: Story = {
  args: {},
};
