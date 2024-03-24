import type { Meta, StoryObj } from "@storybook/react";
import ModelHistoryTimeline from "./ModelHistoryTimeline";
import {
  getFakeUUIDHistoryDetailsArray,
  getFakeUUIDHistoryDetailsArrayWithUnresolvedUUIDS,
} from "./_test_utilities/mockData";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

const meta: Meta<typeof ModelHistoryTimeline> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesHistoryComponents/ModelHistoryTimeline",
  component: ModelHistoryTimeline,
  tags: ["autodocs"],
  args: {
    UUIDHistoryDetails: getFakeUUIDHistoryDetailsArray(1),
  },
};

type Story = StoryObj<typeof ModelHistoryTimeline>;

export const Shown: Story = {};
export const ShownWithMultiple: Story = {
  args: {
    UUIDHistoryDetails: getFakeUUIDHistoryDetailsArray(5),
  },
};
export const ShownWithUnresolvedUUIDS: Story = {
  args: {
    UUIDHistoryDetails: getFakeUUIDHistoryDetailsArrayWithUnresolvedUUIDS(5),
  },
};

export const ShownWithMixedResolvedAndUnresolvedUUIDS: Story = {
  args: {
    UUIDHistoryDetails: [
      ...getFakeUUIDHistoryDetailsArrayWithUnresolvedUUIDS(3),
      ...getFakeUUIDHistoryDetailsArray(3),
    ].sort(() => 0.5 - Math.random()),
  },
};

export const ShownWithLongModelName: Story = {
  args: {
    UUIDHistoryDetails: getOneFakeModel(1).modelHistory,
  },
};

export default meta;
