import type { Meta } from "@storybook/react";
import ImportTimelineItem from "./ImportTimelineItem";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import {Timeline} from "@mui/lab";
import React from "react";

const meta: Meta<typeof ImportTimelineItem> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ImportTimelineItem",
  component: ImportTimelineItem,
  tags: ["autodocs"],
  args: {
    importProcessState: getOneFakeModel(1).importProcessState,
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

export const Multiple = {
  render: renderMultiple,
};

function renderMultiple(args: any) {
  return (
    <React.Fragment>
      <ImportTimelineItem {...args}/>
      <ImportTimelineItem {...args}/>
      <ImportTimelineItem {...args}/>
      <ImportTimelineItem {...args}/>
      <ImportTimelineItem {...args}/>
    </React.Fragment>
  );
}


export default meta;
