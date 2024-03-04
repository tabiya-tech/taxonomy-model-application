// mute the console
import "src/_test_utilities/consoleMock";

import ModelPropertiesContent, {
  DATA_TEST_ID,
  MODEL_PROPERTIES_TAB_ID,
  MODEL_PROPERTIES_TAB_LABEL,
} from "./ModelPropertiesContent";
import { render, screen } from "@testing-library/react";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ModelPropertiesDescription from "./components/ModelPropertiesDescription/ModelPropertiesDescription";
import TabControl from "src/theme/TabControl/TabControl";
import ModelPropertiesVersion from "./components/ModelPropertiesVersion/ModelPropertiesVersion";
import ModelPropertiesHistory from "./components/ModelPropertiesHistory/ModelPropertiesHistory";
import ModelPropertiesImportExport from "./components/ModelPropertiesImportExport/ModelPropertiesImportExport";

// mock TabControl
jest.mock("src/theme/TabControl/TabControl", () => {
  const actualTabControl = jest.requireActual("src/theme/TabControl/TabControl");
  const actualModelPropertiesContent = jest.requireActual("./ModelPropertiesContent");
  return {
    ...actualTabControl,
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return <div data-testid={actualModelPropertiesContent.DATA_TEST_ID.MODEL_PROPERTIES_TABS}> TabControl</div>;
    }),
  };
});

describe("ModelPropertiesContent", () => {
  describe("render tests", () => {
    test("should render correctly with the provided props", async () => {
      // GIVEN a model
      const givenModel = getOneFakeModel(1);

      // WHEN the ModelPropertiesContent is rendered with the given model
      render(<ModelPropertiesContent model={givenModel} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      // AND the content to be shown
      const contentElement = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_CONTENT);
      expect(contentElement).toBeInTheDocument();
      // AND the tabControl to be shown
      const tabControlElement = screen.getByTestId(DATA_TEST_ID.MODEL_PROPERTIES_TABS);
      expect(tabControlElement).toBeInTheDocument();
      // AND the tabControl to have been passed the correct items
      const expectedDescriptionPanel = <ModelPropertiesDescription model={givenModel} />;
      const expectedVersionPanel = <ModelPropertiesVersion model={givenModel} />;
      const expectedHistoryPanel = <ModelPropertiesHistory model={givenModel} />;
      const expectedImportExportPanel = <ModelPropertiesImportExport model={givenModel} />;
      expect(TabControl).toHaveBeenCalledWith(
        {
          items: [
            expect.objectContaining({
              id: MODEL_PROPERTIES_TAB_ID.TAB_ID_DEFINITION,
              label: MODEL_PROPERTIES_TAB_LABEL.TAB_LABEL_DEFINITION,
              panel: expect.objectContaining({
                type: expectedDescriptionPanel.type,
                props: expectedDescriptionPanel.props,
              }),
            }),
            expect.objectContaining({
              id: MODEL_PROPERTIES_TAB_ID.TAB_ID_VERSION,
              label: MODEL_PROPERTIES_TAB_LABEL.TAB_LABEL_VERSION,
              panel: expect.objectContaining({
                type: expectedVersionPanel.type,
                props: expectedVersionPanel.props,
              }),
            }),
            expect.objectContaining({
              id: MODEL_PROPERTIES_TAB_ID.TAB_ID_HISTORY,
              label: MODEL_PROPERTIES_TAB_LABEL.TAB_LABEL_HISTORY,
              panel: expect.objectContaining({
                type: expectedHistoryPanel.type,
                props: expectedHistoryPanel.props,
              }),
            }),
            expect.objectContaining({
              id: MODEL_PROPERTIES_TAB_ID.TAB_ID_IMPORT_EXPORT,
              label: MODEL_PROPERTIES_TAB_LABEL.TAB_LABEL_IMPORT_EXPORT,
              panel: expect.objectContaining({
                type: expectedImportExportPanel.type,
                props: expectedImportExportPanel.props,
              }),
            }),
          ],
          "data-testid": DATA_TEST_ID.MODEL_PROPERTIES_TABS,
          "aria-label": "Model properties tabs",
        },
        {}
      );
      // AND the content should match the snapshot
      expect(contentElement).toMatchSnapshot();
    });
  });
});
