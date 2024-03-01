import { Meta, StoryObj } from "@storybook/react";
import DurationPropertyField from "./DurationPropertyField";

const meta: Meta = {
  title: "components/DurationPropertyField",
  component: DurationPropertyField,
  tags: ["autodocs"],
  args: {
    label: "Duration",
    firstDate: new Date("2021-10-10T10:00:00"),
    secondDate: new Date("2021-10-10T13:05:08"),
  },
};

type Story = StoryObj<typeof DurationPropertyField>;

export const Shown: Story = {};

export default meta;
