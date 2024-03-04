import { Meta, StoryObj } from "@storybook/react";
import ModelPropertiesImportExport from "./ModelPropertiesImportExport";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

const meta: Meta<typeof ModelPropertiesImportExport> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExport",
  component: ModelPropertiesImportExport,
  tags: ["autodocs"],
  args: {
    model: getOneFakeModel(1),
  },
};
export default meta;

type Story = StoryObj<typeof ModelPropertiesImportExport>;

export const Shown: Story = {};
