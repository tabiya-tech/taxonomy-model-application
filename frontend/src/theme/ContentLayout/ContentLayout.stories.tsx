import { Meta, StoryObj } from "@storybook/react";
import ContentLayout from "./ContentLayout";
import { VisualMock } from "src/_test_utilities/VisualMock";

const meta: Meta<typeof ContentLayout> = {
  title: "Components/ContentLayout",
  component: ContentLayout,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ContentLayout>;

export const Shown: Story = {
  args: {
    headerComponent: <VisualMock text={"Header Content"} />,
    mainComponent: <VisualMock text={"Main Content"} />,
  },
};
