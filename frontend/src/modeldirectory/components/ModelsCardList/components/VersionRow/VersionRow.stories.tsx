import type { Meta, StoryObj } from "@storybook/react";

import VersionRow from "./VersionRow";
import { getOneFakeModel } from "src/modeldirectory/_test_utilities/mockModelData";
import { getOneFakeSuccessfulExportProcessState } from "src/modeldirectory/_test_utilities/mockModelData";

const meta: Meta<typeof VersionRow> = {
  title: "ModelDirectory/ModelsCardList/VersionRow",
  component: VersionRow,
  tags: ["autodocs"],
  argTypes: {
    notifyOnExport: { action: "notifyOnExport" },
    notifyOnShowModelDetails: { action: "notifyOnShowModelDetails" },
    notifyOnExplore: { action: "notifyOnExplore" },
    notifyOnRelease: { action: "notifyOnRelease" },
  },
};

export default meta;
type Story = StoryObj<typeof VersionRow>;

function getDownloadableModel() {
  const model = getOneFakeModel(1);
  model.exportProcessState = [getOneFakeSuccessfulExportProcessState(1)];
  return model;
}

export const Latest: Story = {
  args: {
    model: getDownloadableModel(),
    isLatest: true,
    isModelManager: false,
  },
};

export const OlderVersion: Story = {
  args: {
    model: getDownloadableModel(),
    isLatest: false,
    isModelManager: false,
  },
};

export const ModelManagerWithoutSuccessfulExport: Story = {
  args: {
    model: (() => {
      const model = getOneFakeModel(1);
      model.exportProcessState = [];
      return model;
    })(),
    isLatest: true,
    isModelManager: true,
  },
};

export const ModelManagerUnreleasedModel: Story = {
  args: {
    model: (() => {
      const model = getOneFakeModel(1);
      model.released = false;
      return model;
    })(),
    isLatest: false,
    isModelManager: true,
  },
};
