import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { Meta, StoryObj } from "@storybook/react";
import ModelPropertiesDescription from "./ModelPropertiesDescription";

const meta: Meta<typeof ModelPropertiesDescription> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesDescription",
  component: ModelPropertiesDescription,
  tags: ["autodocs"],
  args: {
    model: getOneFakeModel(1),
  },
};

export default meta;

type Story = StoryObj<typeof ModelPropertiesDescription>;

export const Shown: Story = {};
