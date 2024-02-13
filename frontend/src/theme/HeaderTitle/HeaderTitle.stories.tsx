import HeaderTitle from "./HeaderTitle";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof HeaderTitle> = {
  title: "Components/HeaderTitle",
  component: HeaderTitle,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof HeaderTitle>;

export const Shown: Story = {
  args: {
    children: "Header Title",
  },
};
