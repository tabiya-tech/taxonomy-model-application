import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { Meta, StoryObj } from "@storybook/react";
import ModelPropertiesHistory from "./ModelPropertiesHistory";

const meta: Meta<typeof ModelPropertiesHistory> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesHistory",
  component: ModelPropertiesHistory,
  tags: ["autodocs"],
  args: {
    model: getOneFakeModel(1),
  },
};

export default meta;

type Story = StoryObj<typeof ModelPropertiesHistory>;

export const Shown: Story = {};
