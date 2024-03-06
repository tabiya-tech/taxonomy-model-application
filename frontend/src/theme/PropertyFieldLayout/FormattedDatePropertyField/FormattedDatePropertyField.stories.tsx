import { Meta, StoryObj } from "@storybook/react";
import FormattedDatePropertyField from "./FormattedDatePropertyField";

const meta: Meta = {
  title: "components/FormattedDatePropertyField",
  component: FormattedDatePropertyField,
  tags: ["autodocs"],
  args: {
    label: "Date",
    date: new Date(),
  },
};

type Story = StoryObj<typeof FormattedDatePropertyField>;

export const Shown: Story = {};

export default meta;
