// mute the console
import "src/_test_utilities/consoleMock";

import { IUUIDHistoryDetails } from "./UUIDHistory.types";
import { render, screen, within } from "@testing-library/react";
import UUIDHistoryTimeline, { DATA_TEST_ID } from "./UUIDHistoryTimeline";
import {getFakeUUIDHistoryDetailsArray} from "./_test_utilities/mockData";

describe("UUIDHistoryTimeline", () => {
  test("renders correctly", () => {
    // GIVEN a UUIDHistoryDetails array
    const givenUUIDHistoryDetails: IUUIDHistoryDetails[] = getFakeUUIDHistoryDetailsArray(5);

    // WHEN the UUIDHistoryTimeline component is rendered with the given UUIDHistoryDetails
    render(<UUIDHistoryTimeline UUIDHistoryDetails={givenUUIDHistoryDetails} />);

    // THEN expect no errors or warnings to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the timeline to be shown
    const timelineElement = screen.getByTestId(DATA_TEST_ID.UUID_HISTORY_TIMELINE);
    expect(timelineElement).toBeInTheDocument();
    // AND for each UUIDHistoryDetails
    givenUUIDHistoryDetails.forEach((uuidHistoryDetails, index) => {
      // the timeline item to be shown,
      const timelineItemElement = within(timelineElement).getAllByTestId(DATA_TEST_ID.UUID_HISTORY_TIMELINE_ITEM)[index];
      expect(timelineItemElement).toBeInTheDocument();
      // the timeline separator to be shown in the item,
      const timelineSeparatorElement = within(timelineItemElement).getByTestId(
        DATA_TEST_ID.UUID_HISTORY_TIMELINE_SEPARATOR
      );
      expect(timelineSeparatorElement).toBeInTheDocument();
      // the timeline dot to be shown in the separator,
      const timelineDotElement = within(timelineSeparatorElement).getByTestId(DATA_TEST_ID.UUID_HISTORY_TIMELINE_DOT);
      expect(timelineDotElement).toBeInTheDocument();
      // the timeline connector to be shown in the separator,
      const timelineConnectorElement = within(timelineSeparatorElement).getByTestId(
        DATA_TEST_ID.UUID_HISTORY_TIMELINE_CONNECTOR
      );
      expect(timelineConnectorElement).toBeInTheDocument();
      // AND the timeline content to be shown in the item with the text formatted as: name version (localeShortCode)
      const timelineContentElement = within(timelineItemElement).getByTestId(
        DATA_TEST_ID.UUID_HISTORY_TIMELINE_CONTENT
      );
      expect(timelineContentElement).toBeInTheDocument();
      expect(timelineContentElement.textContent).toBe(
        `${uuidHistoryDetails.name} ${uuidHistoryDetails.version} (${uuidHistoryDetails.localeShortCode})`
      );
    });
    // AND the snapshot to match
    expect(timelineElement).toMatchSnapshot();
  });
});
