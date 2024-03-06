import { Meta, StoryObj } from "@storybook/react";
import { getOneFakeExportProcessState } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ExportProcessStateContent from "./ExportProcessStateContent";

const meta: Meta<typeof ExportProcessStateContent> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ExportProcessStateContent",
  component: ExportProcessStateContent,
  tags: ["autodocs"],
  args: {
    exportProcessState: getOneFakeExportProcessState(1),
  },
};

type Story = StoryObj<typeof ExportProcessStateContent>;

export const Shown: Story = {};

export default meta;
