// mute chatty console
import "src/_test_utilities/consoleMock";

import ImportTimelineItem, { DATA_TEST_ID as IMPORT_TIMELINE_ITEM_DATA_TEST_ID } from "./ImportTimelineItem";
import { render, screen } from "src/_test_utilities/test-utils";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ImportProcessStateContent, {
  DATA_TEST_ID as IMPROT_PROCESS_STATE_CONTENT_DATA_TEST_ID,
} from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportProcessStateContent/ImportProcessStateContent";
import { within } from "@testing-library/react";

// mock the ImportProcessStateContent component
jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportProcessStateContent/ImportProcessStateContent",
  () => {
    const actual = jest.requireActual(
      "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ImportTimeline/components/ImportProcessStateContent/ImportProcessStateContent"
    );
    const mockImportProcessStateContent = jest
      .fn()
      .mockImplementation(() => (
        <div data-testid={actual.DATA_TEST_ID.IMPORT_PROCESS_STATE_CONTENT}>ImportProcessStateContent</div>
      ));
    return {
      __esModule: true,
      ...actual,
      default: mockImportProcessStateContent,
    };
  }
);

describe("ImportTimelineItem", () => {
  describe("render tests", () => {
    test("should render with provided importProcessState", () => {
      // GIVEN an importProcessState
      const givenImportProcessState: ModelInfoTypes.ImportProcessState = fakeModel.importProcessState;
      // AND the formattedDate function will return a given string formatted date
      const givenUserFriendlyFormattedDate = "foo-date-user-friendly-formatted";
      const formatDateSpy = jest
        .spyOn(require("src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat"), "formatDate")
        .mockReturnValue(givenUserFriendlyFormattedDate);
      // WHEN the ImportTimelineItem component is rendered
      render(<ImportTimelineItem importProcessState={givenImportProcessState} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the component to be displayed
      const importTimelineItemComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_ITEM);
      expect(importTimelineItemComponent).toBeInTheDocument();
      // AND the importProcessStateContent component to be displayed
      const importProcessStateContentComponent = screen.getByTestId(
        IMPROT_PROCESS_STATE_CONTENT_DATA_TEST_ID.IMPORT_PROCESS_STATE_CONTENT
      );
      expect(importProcessStateContentComponent).toBeInTheDocument();
      // AND the ImportProcessStateContent to have been called with the correct props
      expect(ImportProcessStateContent).toHaveBeenCalledWith({ importProcessState: givenImportProcessState }, {});
      // AND the timelineSeparator component to be displayed
      const timelineSeparatorComponent = screen.getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_SEPARATOR
      );
      expect(timelineSeparatorComponent).toBeInTheDocument();
      // AND the timelineDot component to be displayed
      const timelineDotComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_DOT);
      expect(timelineDotComponent).toBeInTheDocument();
      // AND the timelineConnector component to be displayed
      const timelineConnectorComponent = screen.getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_CONNECTOR
      );
      expect(timelineConnectorComponent).toBeInTheDocument();
      // AND the timelineOppositeContent component to be displayed
      const timelineOppositeContentComponent = screen.getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_OPPOSITE_CONTENT
      );
      expect(timelineOppositeContentComponent).toBeInTheDocument();
      // AND the import creation date to be displayed in the timelineOppositeContent
      const createdAtComponent = within(timelineOppositeContentComponent).getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_OPPOSITE_CONTENT_TIMESTAMP
      );
      expect(createdAtComponent).toBeInTheDocument();
      // AND the formatDate function to have been called with the correct props
      expect(formatDateSpy).toHaveBeenCalledWith(givenImportProcessState.createdAt);
      // AND the component to match the snapshot
      expect(importTimelineItemComponent).toMatchSnapshot();
    });

    test("should render with fallback text when importProcessState.createdAt is not provided", () => {
      // GIVEN an importProcessState without createdAt
      const givenImportProcessState: ModelInfoTypes.ImportProcessState = {
        ...fakeModel.importProcessState,
        createdAt: undefined,
      };
      // WHEN the ImportTimelineItem component is rendered
      render(<ImportTimelineItem importProcessState={givenImportProcessState} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the component to be displayed
      const importTimelineItemComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_ITEM);
      expect(importTimelineItemComponent).toBeInTheDocument();
      // AND the importProcessStateContent component to be displayed
      const importProcessStateContentComponent = screen.getByTestId(
        IMPROT_PROCESS_STATE_CONTENT_DATA_TEST_ID.IMPORT_PROCESS_STATE_CONTENT
      );
      expect(importProcessStateContentComponent).toBeInTheDocument();
      // AND the ImportProcessStateContent to have been called with the correct props
      expect(ImportProcessStateContent).toHaveBeenCalledWith({ importProcessState: givenImportProcessState }, {});
      // AND the timelineSeparator component to be displayed
      const timelineSeparatorComponent = screen.getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_SEPARATOR
      );
      expect(timelineSeparatorComponent).toBeInTheDocument();
      // AND the timelineDot component to be displayed
      const timelineDotComponent = screen.getByTestId(IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_DOT);
      expect(timelineDotComponent).toBeInTheDocument();
      // AND the timelineConnector component to be displayed
      const timelineConnectorComponent = screen.getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_CONNECTOR
      );
      expect(timelineConnectorComponent).toBeInTheDocument();
      // AND the timelineOppositeContent component to be displayed
      const timelineOppositeContentComponent = screen.getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.IMPORT_TIMELINE_OPPOSITE_CONTENT
      );
      expect(timelineOppositeContentComponent).toBeInTheDocument();
      // AND the fallback text to be displayed
      const fallbackTextComponent = within(timelineOppositeContentComponent).getByTestId(
        IMPORT_TIMELINE_ITEM_DATA_TEST_ID.FALLBACK_TEXT
      );
      expect(fallbackTextComponent).toBeInTheDocument();
      // AND the component to match the snapshot
      expect(importTimelineItemComponent).toMatchSnapshot();
    });
  });
});
