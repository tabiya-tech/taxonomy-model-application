import { Meta, StoryObj } from "@storybook/react";
import OccupationsExplorer from "./OccupationsExplorer";

const meta: Meta<typeof OccupationsExplorer> = {
  title: "Explorer/OccupationsExplorer",
  component: OccupationsExplorer,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof OccupationsExplorer>;

export const Shown: Story = {
  args: {},
};
