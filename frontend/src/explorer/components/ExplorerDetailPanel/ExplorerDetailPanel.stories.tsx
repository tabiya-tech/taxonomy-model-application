import type { Meta, StoryObj } from "@storybook/react";
import ExplorerDetailPanel from "./ExplorerDetailPanel";

const meta: Meta<typeof ExplorerDetailPanel> = {
  title: "Explorer/Components/ExplorerDetailPanel",
  component: ExplorerDetailPanel,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ExplorerDetailPanel>;

export const NoSelection: Story = {
  args: {
    item: null,
  },
};

export const WithSelection: Story = {
  args: {
    item: {
      id: "S3.0.2",
      code: "S3.0.2",
      title: "diagnose medical conditions",
      definition:
        "Determine the cause of abnormality by examining the patient using physical examination techniques and by reviewing medical history, results of diagnostic tests, and other data, in order to formulate a diagnosis.",
    },
  },
};

export const Loading: Story = {
  args: {
    item: null,
    isLoading: true,
  },
};
