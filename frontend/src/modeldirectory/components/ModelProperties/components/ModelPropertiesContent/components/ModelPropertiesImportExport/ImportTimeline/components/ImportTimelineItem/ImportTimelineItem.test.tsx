// mute chatty console
import "src/_test_utilities/consoleMock";

import ImportTimelineItem, {DATA_TEST_ID as IMPORT_TIMELINE_ITEM_DATA_TEST_ID } from "./ImportTimelineItem";
import { render, screen } from "src/_test_utilities/test-utils";
import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";
import {
  getOneFakeImportProcessState
} from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ImportProcessStateContent, {DATA_TEST_ID as IMPROT_PROCESS_STATE_CONTENT_DATA_TEST_ID } from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportProcessStateContent/ImportProcessStateContent";
import {TimelineDot, TimelineOppositeContent} from "@mui/lab";

// mock the ImportProcessStateContent component
jest.mock("src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportProcessStateContent/ImportProcessStateContent", () => {
  const actual = jest.requireActual("src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportProcessStateContent/ImportProcessStateContent");
  const mockImportProcessStateContent = jest.fn().mockImplementation(() => <div data-testid={actual.DATA_TEST_ID.IMPORT_PROCESS_STATE_CONTENT}>ImportProcessStateContent</div>)
  return {
    __esModule: true,
    ...actual,
    default: mockImportProcessStateContent,
  };
});

describe("ImportTimelineItem", () => {
  describe("render tests", () => {
    test("should render with provided importProcessState", () => {
      // GIVEN an importProcessState
      const givenImportProcessState : ModelInfoTypes.ImportProcessState = getOneFakeImportProcessState(1)
      // WHEN the component is rendered
      // @ts-ignore
      const timelineDotSpy = jest.spyOn(TimelineDot, "render")
      // @ts-ignore
      const timelineOppositeContentSpy = jest.spyOn(TimelineOppositeContent, "render")
      render(<ImportTimelineItem importProcessState={givenImportProcessState} />);
      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the component to be displayed
      const importTimelineItemComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_ITEM);
      expect(importTimelineItemComponent).toBeInTheDocument();
      // AND the importProcessStateContent component to be displayed
      const importProcessStateContentComponent = screen.getByTestId(IMPROT_PROCESS_STATE_CONTENT_DATA_TEST_ID.IMPORT_PROCESS_STATE_CONTENT);
      expect(importProcessStateContentComponent).toBeInTheDocument();
      // AND the ImportProcessStateContent to have been called with the correct props
      expect(ImportProcessStateContent).toHaveBeenCalledWith({importProcessState: givenImportProcessState}, {});
      // AND the timelineSeparator component to be displayed
      const timelineSeparatorComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.TIMELINE_SEPARATOR);
      expect(timelineSeparatorComponent).toBeInTheDocument();
      // AND the timelineDot component to be displayed
      const timelineDotComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.TIMELINE_DOT);
      expect(timelineDotComponent).toBeInTheDocument();
      // AND the TimelineDot to have been called with the correct props
      expect(timelineDotSpy).toHaveBeenCalledWith(expect.objectContaining({"data-testid": IMPORT_TIMELINE_ITEM_DATA_TEST_ID.TIMELINE_DOT}), null);
      const timelineConnectorComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.TIMELINE_CONNECTOR);
      expect(timelineConnectorComponent).toBeInTheDocument();
      // AND the timestamp to be displayed
      const timestampComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMESTAMP);
      expect(timestampComponent).toBeInTheDocument();
      // AND the timelineOppositeContent component to be displayed
      const timelineOppositeContentComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.TIMELINE_OPPOSITE_CONTENT);
      expect(timelineOppositeContentComponent).toBeInTheDocument();
      // AND the TimelineOppositeContent to have been called with the correct props
      expect(timelineOppositeContentSpy).toHaveBeenCalledWith(expect.objectContaining({
        "data-testid": IMPORT_TIMELINE_ITEM_DATA_TEST_ID.TIMELINE_OPPOSITE_CONTENT,
        children: expect.objectContaining({props: expect.objectContaining({children: givenImportProcessState.id})})
      }), null);
      // AND the component to match the snapshot
      expect(ImportTimelineItem).toMatchSnapshot();
    });
  });
});
