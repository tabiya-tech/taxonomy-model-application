import { Meta, StoryObj } from "@storybook/react";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";
import TextPropertyField from "./TextPropertyField";

const meta: Meta = {
  title: "components/TextPropertyField",
  component: TextPropertyField,
  tags: ["autodocs"],
  args: {
    label: "foo",
    text: getRandomLorem(100),
  },
};

type Story = StoryObj<typeof TextPropertyField>;

export const Shown: Story = {};

export const ShownWithLongText: Story = {
  args: {
    text: getRandomLorem(1000),
  },
};

export default meta;
