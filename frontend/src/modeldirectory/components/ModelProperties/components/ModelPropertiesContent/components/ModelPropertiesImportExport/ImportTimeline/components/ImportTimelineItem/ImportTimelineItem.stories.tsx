import type { Meta } from "@storybook/react";
import ImportTimelineItem from "./ImportTimelineItem";
import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { Timeline } from "@mui/lab";
import React from "react";

const meta: Meta<typeof ImportTimelineItem> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ImportTimelineItem",
  component: ImportTimelineItem,
  tags: ["autodocs"],
  args: {
    importProcessState: fakeModel.importProcessState,
  },
  decorators: [
    (Story) => (
      <Timeline>
        <Story />
      </Timeline>
    ),
  ],
};

export const Shown = {};

export default meta;
