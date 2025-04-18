// mute chatty console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ExportTimelineItem, { DATA_TEST_ID } from "./ExportTimelineItem";
import { DATA_TEST_ID as DOWNLOAD_TEST_ID } from "src/modeldirectory/components/DownloadModelButton/DownloadModelButton";
import { within } from "@testing-library/react";
import ExportProcessStateContent from "src/modeldirectory/components/ModelProperties/components/ModelPropertiesContent/components/ModelPropertiesImportExport/ExportTimeline/components/ExportProcessStateContent/ExportProcessStateContent";
import { mockLoggedInUser, TestUsers } from "src/_test_utilities/mockLoggedInUser";

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
  test.each([
    ["ModelManager", TestUsers.ModelManager],
    ["RegisteredUser", TestUsers.RegisteredUser],
    ["Anonymous", TestUsers.Anonymous],
  ])("renders correctly with the provided exportProcessState when user has %s role", (_user, testUser) => {
    // GIVEN an exportProcessState
    const givenExportProcessState: ModelInfoTypes.ExportProcessState = fakeModel.exportProcessState[0];

    const givenUserFriendlyFormattedDate = "foo-date-user-friendly-formatted";
    const formatDateSpy = jest
      .spyOn(require("src/theme/PropertyFieldLayout/FormattedDatePropertyField/userFriendlyDateFormat"), "formatDate")
      .mockReturnValue(givenUserFriendlyFormattedDate);
    // AND the user has the specific role
    mockLoggedInUser({ user: testUser });

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
    // AND the download button to be displayed
    const downloadButton = within(timelineOppositeContentComponent).getByTestId(DOWNLOAD_TEST_ID.DOWNLOAD_MODEL_BUTTON);
    expect(downloadButton).toBeInTheDocument();
    // AND the component to match the snapshot
    expect(exportTimelineItemComponent).toMatchSnapshot();
  });

  test("renders correctly when the exportProcessState doesnt have a downloadUrl", () => {
    // GIVEN an exportProcessState without a downloadUrl
    const givenExportProcessState: ModelInfoTypes.ExportProcessState = fakeModel.exportProcessState[0];
    givenExportProcessState.downloadUrl = "";

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
    // AND the download button to not be displayed
    expect(screen.queryByTestId("download-model-button")).toBeNull();
    // AND the component to match the snapshot
    expect(exportTimelineItemComponent).toMatchSnapshot();
  });
});
