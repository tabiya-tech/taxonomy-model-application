import { Meta, StoryObj } from "@storybook/react";
import { AppLayout } from "./AppLayout";
import { VisualMock } from "src/_test_utilities/VisualMock";

const meta: Meta<typeof AppLayout> = {
  title: "Application/AppLayout",
  component: AppLayout,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof AppLayout>;

export const Shown: Story = {
  args: {
    children: <VisualMock text={"Content"} />,
  },
};
