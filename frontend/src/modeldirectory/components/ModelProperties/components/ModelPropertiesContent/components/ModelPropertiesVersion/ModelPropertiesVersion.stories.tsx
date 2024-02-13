import { Meta, StoryObj } from "@storybook/react";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ModelPropertiesVersion from "./ModelPropertiesVersion";

const meta: Meta<typeof ModelPropertiesVersion> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesVersion",
  component: ModelPropertiesVersion,
  tags: ["autodocs"],
  args: {
    model: getOneFakeModel(1),
  },
};

export default meta;

type Story = StoryObj<typeof ModelPropertiesVersion>;

export const Shown: Story = {};
