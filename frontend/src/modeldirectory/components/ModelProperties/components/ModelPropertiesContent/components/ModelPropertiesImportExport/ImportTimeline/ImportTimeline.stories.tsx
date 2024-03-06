import type { Meta, StoryObj } from "@storybook/react";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ImportTimeline from "./ImportTimeline";

const meta: Meta<typeof ImportTimeline> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ImportTimeline",
  component: ImportTimeline,
  tags: ["autodocs"],
  args: {
    importProcessState: getOneFakeModel(1).importProcessState,
  },
};

type Story = StoryObj<typeof ImportTimeline>;

export const Shown: Story = {};

export default meta;
