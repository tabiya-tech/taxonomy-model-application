import type { Meta, StoryObj } from "@storybook/react";
import UUIDHistoryTimeline from "./UUIDHistoryTimeline";
import { getFakeUUIDHistoryDetailsArray } from "./_test_utilities/mockData";

const meta: Meta<typeof UUIDHistoryTimeline> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesHistoryComponents/UUIDHistoryTimeline",
  component: UUIDHistoryTimeline,
  tags: ["autodocs"],
  args: {
    UUIDHistoryDetails: getFakeUUIDHistoryDetailsArray(5),
  },
};

type Story = StoryObj<typeof UUIDHistoryTimeline>;

export const Shown: Story = {};

export default meta;
