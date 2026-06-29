import { Meta, StoryObj } from "@storybook/react";
import SkillsExplorer from "./SkillsExplorer";

const meta: Meta<typeof SkillsExplorer> = {
  title: "Explorer/SkillsExplorer",
  component: SkillsExplorer,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof SkillsExplorer>;

export const Shown: Story = {
  args: {},
};
