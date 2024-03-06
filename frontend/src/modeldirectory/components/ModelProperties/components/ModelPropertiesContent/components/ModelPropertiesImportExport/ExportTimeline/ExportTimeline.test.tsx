// mute chatty console
import "src/_test_utilities/consoleMock";

import { getOneFakeExportProcessState } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "@testing-library/react";
import ExportTimeline, { DATA_TEST_ID as EXPORT_TIMELINE_DATA_TEST_ID } from "./ExportTimeline";
import ExportTimelineItem from "./components/ExportTimelineItem/ExportTimelineItem";

// mock the ExportTimelineItem component
jest.mock("./components/ExportTimelineItem/ExportTimelineItem", () => {
  const actual = jest.requireActual("./components/ExportTimelineItem/ExportTimelineItem");
  return {
    __esModule: true,
    ...actual,
    default: jest.fn().mockImplementation(() => {
      return <div data-testid="timeline-item" />;
    }),
  };
});

describe("ExportTimeline", () => {
  test("renders correctly with some exportProcessStates", () => {
    // GIVEN N export process state
    const givenExportProcessStates = [];
    for (let i = 0; i < 3; i++) {
      givenExportProcessStates.push(getOneFakeExportProcessState(i));
    }

    // WHEN the ImportTimeline component is rendered with the given import process state
    render(<ExportTimeline exportProcessStates={givenExportProcessStates} />);

    // THEN expect no errors or warnings to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the timeline to be shown
    const timeline = screen.getByTestId(EXPORT_TIMELINE_DATA_TEST_ID.EXPORT_TIMELINE);
    expect(timeline).toBeInTheDocument();
    // AND each exportProcessState to be shown with a timeline item
    const timelineItems = screen.getAllByTestId("timeline-item");
    expect(timelineItems).toHaveLength(givenExportProcessStates.length);
    givenExportProcessStates.forEach((exportProcessState, index) => {
      expect(ExportTimelineItem).toHaveBeenNthCalledWith(index + 1, { exportProcessState }, {});
    });
    // AND to match the snapshot
    expect(timeline).toMatchSnapshot();
  });
});
