import type { Meta, StoryObj } from "@storybook/react";

import ModelsCardList from "./ModelsCardList";
import {
  getArrayOfFakeModels,
  getArrayOfFakeModelsMaxLength,
  getOneFakeSuccessfulExportProcessState,
} from "src/modeldirectory/_test_utilities/mockModelData";

const meta: Meta<typeof ModelsCardList> = {
  title: "ModelDirectory/ModelsCardList/ModelsCardList",
  component: ModelsCardList,
  tags: ["autodocs"],
  argTypes: {
    notifyOnExport: { action: "notifyOnExport" },
    notifyOnShowModelDetails: { action: "notifyOnShowModelDetails" },
    notifyOnExplore: { action: "notifyOnExplore" },
  },
};

export default meta;
type Story = StoryObj<typeof ModelsCardList>;

function getDownloadableModels(count: number, versionsPerLocale: number = 1) {
  const models = getArrayOfFakeModels(count).map((model, index) => ({
    ...model,
    exportProcessState: [getOneFakeSuccessfulExportProcessState(index)],
  }));
  // reuse the same locale for consecutive models to get multiple versions per card
  for (let i = 0; i < models.length; i++) {
    models[i].locale = models[i - (i % versionsPerLocale)].locale;
  }
  return models;
}

export const Shown: Story = {
  args: {
    models: getDownloadableModels(9, 3),
    isLoading: false,
  },
};

export const ShownWithLongData: Story = {
  args: {
    models: getArrayOfFakeModelsMaxLength(4),
    isLoading: false,
  },
};

export const ShownInLoadingState: Story = {
  args: {
    models: [],
    isLoading: true,
  },
};

export const ShownEmpty: Story = {
  args: {
    models: [],
    isLoading: false,
  },
};
