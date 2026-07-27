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

export const WithHistory: Story = {
  args: {
    item: {
      id: "S3.0.2",
      code: "S3.0.2",
      title: "diagnose medical conditions",
      definition: "Determine the cause of abnormality by examining the patient.",
    },
    history: [
      {
        id: "entry-2",
        preferredLabel: "diagnose medical conditions",
        model: {
          id: "model-2",
          UUID: "model-2-uuid",
          name: "ESCO",
          version: "v1.0.1-rc.1",
          localeShortCode: "en",
        },
      },
      {
        id: "entry-esco",
        preferredLabel: "diagnose a medical condition",
        model: {
          id: "model-esco",
          UUID: "model-esco-uuid",
          name: "ESCO",
          version: "v1.1.1",
          localeShortCode: "en",
        },
      },
    ],
  },
};

export const HistoryLoading: Story = {
  args: {
    item: {
      id: "S3.0.2",
      code: "S3.0.2",
      title: "diagnose medical conditions",
      definition: "Determine the cause of abnormality by examining the patient.",
    },
    history: null,
    isHistoryLoading: true,
  },
};

export const NoSelection: Story = {
  args: {
    item: null,
  },
};

export const Loading: Story = {
  args: {
    item: null,
    isLoading: true,
  },
};
