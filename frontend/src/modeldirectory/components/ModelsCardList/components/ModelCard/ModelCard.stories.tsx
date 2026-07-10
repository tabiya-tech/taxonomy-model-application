import type { Meta, StoryObj } from "@storybook/react";

import ModelCard from "./ModelCard";
import { groupModelsByLocale } from "src/modeldirectory/components/ModelsCardList/groupModelsByLocale";
import { getArrayOfFakeModels, getOneFakeModel } from "src/modeldirectory/_test_utilities/mockModelData";

const meta: Meta<typeof ModelCard> = {
  title: "ModelDirectory/ModelsCardList/ModelCard",
  component: ModelCard,
  tags: ["autodocs"],
  argTypes: {
    notifyOnExport: { action: "notifyOnExport" },
    notifyOnShowModelDetails: { action: "notifyOnShowModelDetails" },
    notifyOnExplore: { action: "notifyOnExplore" },
  },
};

export default meta;
type Story = StoryObj<typeof ModelCard>;

function getGroupWithVersions(count: number) {
  const locale = getOneFakeModel(1).locale;
  const models = getArrayOfFakeModels(count).map((model) => ({ ...model, locale }));
  return groupModelsByLocale(models)[0];
}

export const MultipleVersions: Story = {
  args: {
    group: getGroupWithVersions(3),
    isModelManager: false,
  },
};

export const SingleVersion: Story = {
  args: {
    group: getGroupWithVersions(1),
    isModelManager: false,
  },
};

export const ModelManagerView: Story = {
  args: {
    group: getGroupWithVersions(3),
    isModelManager: true,
  },
};
