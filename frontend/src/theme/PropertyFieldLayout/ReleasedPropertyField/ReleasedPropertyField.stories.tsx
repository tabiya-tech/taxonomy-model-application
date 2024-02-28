import ReleasedPropertyField from "./ReleasedPropertyField";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "components/ReleasedPropertyField",
  component: ReleasedPropertyField,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ReleasedPropertyField>;

export const ShownWithReleased: Story = {
  args: {
    released: true,
  },
};

export const ShownWithNotReleased: Story = {
  args: {
    released: false,
  },
};
