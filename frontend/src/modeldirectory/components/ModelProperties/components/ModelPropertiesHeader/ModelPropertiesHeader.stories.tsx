import ModelPropertiesHeader from "./ModelPropertiesHeader";
import { Meta, StoryObj } from "@storybook/react";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import {getRandomLorem} from "src/_test_utilities/specialCharacters";

const meta: Meta<typeof ModelPropertiesHeader> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesHeader",
  component: ModelPropertiesHeader,
  tags: ["autodocs"],
  argTypes: { notifyOnClose: { action: "notifyOnClose" } },
  args: {
    model: getOneFakeModel(1),
  },
};

export default meta;

type Story = StoryObj<typeof ModelPropertiesHeader>;

export const Shown: Story = {};

const modelWithLongName = getOneFakeModel()
modelWithLongName.name = getRandomLorem(600)

export const ShownWithTruncatedText: Story = {
  args: {
    model: modelWithLongName
  }
};
