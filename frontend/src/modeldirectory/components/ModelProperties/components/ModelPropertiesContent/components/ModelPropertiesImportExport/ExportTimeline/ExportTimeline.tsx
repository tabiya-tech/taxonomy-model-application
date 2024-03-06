import React from "react";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { VisualMock } from "src/_test_utilities/VisualMock";

interface ExportTimelineProps {
  exportProcessState: ModelInfoTypes.ExportProcessState;
}

/**
 * ExportTimeline is responsible for showing a timeline with the export process entries for a model
 */
const ExportTimeline: React.FC<ExportTimelineProps> = (props) => {
  return <VisualMock text="ExportTimeline" />;
};

export default ExportTimeline;
