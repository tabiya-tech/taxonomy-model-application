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

const date = new Date(); // Gets the current date
date.setDate(date.getDate() - 1);// Sets the date to one day before

export const Ongoing: Story = {
  args: {
    firstDate: date,
    secondDate: undefined,
  },
};

export const InvalidDateRange = {
  args: {
    firstDate: new Date("2021-10-20"),
    secondDate: new Date("2021-10-19"),
  },
};

export default meta;
