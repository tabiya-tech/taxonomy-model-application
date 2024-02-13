import { Meta, StoryObj } from "@storybook/react";
import TabControl from "./TabControl";
import { VisualMock } from "src/_test_utilities/VisualMock";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";

const meta: Meta<typeof TabControl> = {
  title: "Components/TabControl",
  component: TabControl,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof TabControl>;

export const Shown: Story = {
  args: {
    items: [
      { id: "1", label: "Tab 1", panel: <VisualMock text={"Tab 1 Content"} /> },
      { id: "2", label: "Tab 2", panel: <VisualMock text={"Tab 2 Content"} /> },
      { id: "3", label: "Tab 3", panel: <VisualMock text={"Tab 3 Content"} /> },
    ],
  },
};

export const ShownWithLongText: Story = {
  args: {
    items: [
      { id: "1", label: getRandomLorem(50), panel: <VisualMock text={getRandomLorem(500)} /> },
      { id: "2", label: getRandomLorem(100), panel: <VisualMock text={getRandomLorem(750)} /> },
      { id: "3", label: getRandomLorem(150), panel: <VisualMock text={getRandomLorem(1000)} /> },
    ],
  },
};
