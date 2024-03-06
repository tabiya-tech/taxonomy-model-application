// mute chatty console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getOneFakeExportProcessState } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ExportTimelineItem, { DATA_TEST_ID } from "./ExportTimelineItem";
import { within } from "@testing-library/react";
import ExportProcessStateContent from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/components/ExportProcessStateContent/ExportProcessStateContent";

// mock the ExportProcessStateContent component
jest.mock(
  "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/components/ExportProcessStateContent/ExportProcessStateContent",
  () => {
    const actual = jest.requireActual(
      "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/components/ExportProcessStateContent/ExportProcessStateContent"
    );
    const mockExportProcessStateContent = jest
      .fn()
      .mockImplementation(() => <div data-testid="export-process-state-content">ExportProcessStateContent</div>);
    return {
      __esModule: true,
      ...actual,
      default: mockExportProcessStateContent,
    };
  }
);

describe("ExportTimelineItem", () => {
  test("renders correctly with the provided exportProcessState", () => {
    // GIVEN an exportProcessState
    const givenExportProcessState: ModelInfoTypes.ExportProcessState = getOneFakeExportProcessState(1);

    const givenUserFriendlyFormattedDate = "foo-date-user-friendly-formatted";
    const formatDateSpy = jest
      .spyOn(require("src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat"), "formatDate")
      .mockReturnValue(givenUserFriendlyFormattedDate);
    // WHEN the ExportTimelineItem component is rendered with the given exportProcessState
    render(<ExportTimelineItem exportProcessState={givenExportProcessState} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be displayed
    const exportTimelineItemComponent = screen.getByTestId(DATA_TEST_ID.EXPORT_TIMELINE_ITEM);
    expect(exportTimelineItemComponent).toBeInTheDocument();
    // AND the timelineContent component to be displayed
    const timelineContentComponent = screen.getByTestId(DATA_TEST_ID.EXPORT_TIMELINE_CONTENT);
    expect(timelineContentComponent).toBeInTheDocument();
    // AND the exportProcessStateContent component to be displayed in the timelineContent
    const exportProcessStateContentComponent =
      within(timelineContentComponent).getByTestId("export-process-state-content");
    expect(exportProcessStateContentComponent).toBeInTheDocument();
    // AND the ExportProcessStateContent to have been called with the correct props
    expect(ExportProcessStateContent).toHaveBeenCalledWith({ exportProcessState: givenExportProcessState }, {});
    // AND the timelineSeparator component to be displayed
    const timelineSeparatorComponent = screen.getByTestId(DATA_TEST_ID.EXPORT_TIMELINE_SEPARATOR);
    expect(timelineSeparatorComponent).toBeInTheDocument();
    // AND the timelineDot component to be displayed
    const timelineDotComponent = screen.getByTestId(DATA_TEST_ID.EXPORT_TIMELINE_DOT);
    expect(timelineDotComponent).toBeInTheDocument();
    // AND the timelineConnector component to be displayed
    const timelineConnectorComponent = screen.getByTestId(DATA_TEST_ID.EXPORT_TIMELINE_CONNECTOR);
    expect(timelineConnectorComponent).toBeInTheDocument();
    // AND the timelineOppositeContent component to be displayed
    const timelineOppositeContentComponent = screen.getByTestId(DATA_TEST_ID.EXPORT_TIMELINE_OPPOSITE_CONTENT);
    expect(timelineOppositeContentComponent).toBeInTheDocument();
    // AND the export creation date to be displayed in the timelineOppositeContent
    const createdAtComponent = within(timelineOppositeContentComponent).getByTestId(
      DATA_TEST_ID.EXPORT_TIMELINE_OPPOSITE_CONTENT_CREATED_AT
    );
    expect(createdAtComponent).toBeInTheDocument();
    // AND the export creation date to be the given user friendly formatted date
    expect(formatDateSpy).toHaveBeenCalledWith(givenExportProcessState.timestamp);
    // AND the component to match the snapshot
    expect(exportTimelineItemComponent).toMatchSnapshot();
  });
});
