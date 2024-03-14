import React from "react";
import { IUUIDHistoryDetails } from "./UUIDHistory.types";
import { VisualMock } from "src/_test_utilities/VisualMock";

interface UUIDHistoryTimelineProps {
  UUIDHistoryDetails: IUUIDHistoryDetails[];
}

const UUIDHistoryTimeline: React.FC<UUIDHistoryTimelineProps> = () => {
  return <VisualMock text="UUIDHistoryTimeline" />;
};

export default UUIDHistoryTimeline;
