import { Meta, StoryObj } from "@storybook/react";
import HelpTip from "./HelpTip";

const meta: Meta = {
  title: "components/HelpTip",
  component: HelpTip,
  tags: ["autodocs"],
  args: {
    children: (
      <div>
        <p>HelpTip is responsible for showing a tooltip that shows a helpful dialog with some react component</p>
        <p>@param props</p>
        <p>@constructor</p>
      </div>
    ),
  },
};

type Story = StoryObj<typeof HelpTip>;

export const Shown: Story = {};

export default meta;
