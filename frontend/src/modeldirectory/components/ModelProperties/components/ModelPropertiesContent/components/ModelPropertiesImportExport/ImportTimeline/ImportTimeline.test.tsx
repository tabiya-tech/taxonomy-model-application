// mute the console
import "src/_test_utilities/consoleMock";

import { getOneRandomModelMaxLength } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { render, screen } from "@testing-library/react";
import ImportTimeline, { DATA_TEST_ID as TIMELINE_DATA_TEST_ID } from "./ImportTimeline";
import ImportTimelineItem, {
  DATA_TEST_ID as TIMELINE_ITEM_DATA_TEST_ID
} from "./components/ImportTimelineItem/ImportTimelineItem";
import * as React from "react";

// mock the ImportTimelineItem component
jest.mock("./components/ImportTimelineItem/ImportTimelineItem", () => {
  const actual = jest.requireActual("./components/ImportTimelineItem/ImportTimelineItem");
  const mockImportTimelineItem = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.IMPORT_TIMELINE_ITEM}> My Models Table</div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockImportTimelineItem,
  };
});

describe("ImportTimeline", () => {
  test("renders correctly", () => {
    // GIVEN an import process state
    const givenImportProcessState = getOneRandomModelMaxLength().importProcessState;

    // WHEN the ImportTimeline component is rendered with the given import process state
    render(<ImportTimeline importProcessState={givenImportProcessState} />);

    // THEN expect no errors or warnings to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the timeline to be shown
    const timeline = screen.getByTestId(TIMELINE_DATA_TEST_ID.IMPORT_TIMELINE);
    expect(timeline).toBeInTheDocument();
    // AND the ImportTimelineItem to be shown
    const timelineItem = screen.getByTestId(TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_ITEM);
    expect(timelineItem).toBeInTheDocument();
    // AND the ImportTimelineItem to have been called with the correct props
    expect(ImportTimelineItem).toHaveBeenCalledWith({ importProcessState: givenImportProcessState }, {});
    // AND to match the snapshot
    expect(timeline).toMatchSnapshot();
  });
});
