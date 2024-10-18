import type { Meta, StoryObj } from "@storybook/react";

import Stepper from "./Stepper";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";

const meta: Meta<typeof Stepper> = {
  title: "Components/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof Stepper>;

const generateSteps = (numSteps: number) => {
  const steps = [];
  for (let i = 1; i <= numSteps; i++) {
    steps.push({
      id: i.toString(),
      title: `Step ${i}`,
      subtitle: `Subtitle ${i}`,
      content: <div>{getRandomLorem(1000)}</div>,
    });
  }
  return steps;
};

export const Shown: Story = {
  args: {
    steps: generateSteps(2),
  },
};

export const OneStep: Story = {
  args: {
    steps: generateSteps(1),
  },
};

export const ThreeSteps: Story = {
  args: {
    steps: generateSteps(3),
  },
};

export const TenSteps: Story = {
  args: {
    steps: generateSteps(10),
  },
};
