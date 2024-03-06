import { Meta, StoryObj } from "@storybook/react";
import { getOneFakeImportProcessState } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ImportProcessStateContent from "./ImportProcessStateContent";

const meta: Meta<typeof ImportProcessStateContent> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ImportProcessStateContent",
  component: ImportProcessStateContent,
  tags: ["autodocs"],
  args: {
    importProcessState: getOneFakeImportProcessState(1),
  },
};

type Story = StoryObj<typeof ImportProcessStateContent>;

export const Shown: Story = {};

export default meta;
