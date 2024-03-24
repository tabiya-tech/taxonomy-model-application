import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { Meta, StoryObj } from "@storybook/react";
import ModelPropertiesHistory from "./ModelPropertiesHistory";
import { getFakeUUIDHistoryDetailsArray } from "./UUIDHistoryTimeline/_test_utilities/mockData";

const fakeModel = getOneFakeModel(1);
fakeModel.modelHistory = getFakeUUIDHistoryDetailsArray(25);

const meta: Meta<typeof ModelPropertiesHistory> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesHistory",
  component: ModelPropertiesHistory,
  tags: ["autodocs"],
  args: {
    model: fakeModel,
  },
};

export default meta;

type Story = StoryObj<typeof ModelPropertiesHistory>;

export const Shown: Story = {};
