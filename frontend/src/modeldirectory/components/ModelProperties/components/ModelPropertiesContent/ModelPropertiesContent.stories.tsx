import type { Meta, StoryObj } from "@storybook/react";
import ModelPropertiesContent from "./ModelPropertiesContent";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

const meta: Meta<typeof ModelPropertiesContent> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContent",
  component: ModelPropertiesContent,
  tags: ["autodocs"],
  args: {
    model: getOneFakeModel(1),
  },
};

type Story = StoryObj<typeof ModelPropertiesContent>;

export const Shown: Story = {};

export default meta;
