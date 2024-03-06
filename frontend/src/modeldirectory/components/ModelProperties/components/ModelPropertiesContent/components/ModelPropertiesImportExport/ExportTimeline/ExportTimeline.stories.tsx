import { Meta, StoryObj } from "@storybook/react";
import { getArrayOfFakeExportProcessStates } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ExportTimeline from "./ExportTimeline";

const meta: Meta<typeof ExportTimeline> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ExportTimeline",
  component: ExportTimeline,
  tags: ["autodocs"],
  args: {
    exportProcessStates: getArrayOfFakeExportProcessStates(1),
  },
};

type Story = StoryObj<typeof ExportTimeline>;

export const Shown: Story = {};

export const MultipleExportProcessStates: Story = {
  args: {
    exportProcessStates: getArrayOfFakeExportProcessStates(3),
  },
};

export default meta;
