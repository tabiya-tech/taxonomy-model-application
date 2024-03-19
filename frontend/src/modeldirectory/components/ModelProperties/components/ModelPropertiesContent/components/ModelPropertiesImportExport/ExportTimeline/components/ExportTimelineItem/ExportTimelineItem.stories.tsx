import { Meta, StoryObj } from "@storybook/react";
import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ExportTimelineItem from "./ExportTimelineItem";
import { Timeline } from "@mui/lab";

const meta: Meta<typeof ExportTimelineItem> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ExportTimelineItem",
  component: ExportTimelineItem,
  tags: ["autodocs"],
  args: {
    exportProcessState: fakeModel.exportProcessState[0],
  },
  decorators: [
    (Story) => (
      <Timeline>
        <Story />
      </Timeline>
    ),
  ],
};

type Story = StoryObj<typeof ExportTimelineItem>;

export const Shown: Story = {};

export default meta;
