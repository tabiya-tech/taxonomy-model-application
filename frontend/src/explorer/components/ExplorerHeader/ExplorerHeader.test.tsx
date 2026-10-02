// mute the console
import "src/_test_utilities/consoleMock";

import ExplorerHeader, { DATA_TEST_ID, TEXT } from "./ExplorerHeader";
import { render, screen, within } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import { getArrayOfFakeModels } from "src/modeldirectory/_test_utilities/mockModelData";

// Default action handlers shared across the render calls below.
const givenActionHandlers = () => ({
  onBackToDirectory: jest.fn(),
  onOpenApiDocs: jest.fn(),
  onLanguageChange: jest.fn(),
});

describe("ExplorerHeader", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  describe("loading state", () => {
    test("should render skeleton while loading", () => {
      // GIVEN isLoading is true
      const givenIsLoading = true;

      // WHEN the component is rendered
      render(
        <ExplorerHeader
          isLoading={givenIsLoading}
          language="en"
          models={[]}
          selectedModel={null}
          onModelChange={jest.fn()}
          {...givenActionHandlers()}
        />
      );

      // THEN expect no errors or warnings
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the skeleton is shown
      expect(screen.getByTestId(DATA_TEST_ID.SKELETON)).toBeInTheDocument();
      // AND the model name and select are not shown
      expect(screen.queryByTestId(DATA_TEST_ID.MODEL_NAME)).not.toBeInTheDocument();
      expect(screen.queryByTestId(DATA_TEST_ID.MODEL_SELECT)).not.toBeInTheDocument();
      // AND it matches the snapshot
      expect(screen.getByTestId(DATA_TEST_ID.SKELETON)).toMatchSnapshot();
    });
  });

  describe("no models available", () => {
    test("should render 'No Models available' when there are no models", () => {
      // GIVEN isLoading is false
      const givenIsLoading = false;
      // AND no selected model
      const givenSelectedModel = null;

      // WHEN the component is rendered
      render(
        <ExplorerHeader
          isLoading={givenIsLoading}
          language="en"
          models={[]}
          selectedModel={givenSelectedModel}
          onModelChange={jest.fn()}
          {...givenActionHandlers()}
        />
      );

      // THEN expect no errors or warnings
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the no-models message is shown
      expect(screen.getByTestId(DATA_TEST_ID.NO_MODELS_TEXT)).toBeInTheDocument();
      // AND the model name and select are not shown
      expect(screen.queryByTestId(DATA_TEST_ID.MODEL_NAME)).not.toBeInTheDocument();
      expect(screen.queryByTestId(DATA_TEST_ID.MODEL_SELECT)).not.toBeInTheDocument();
    });
  });

  describe("model selected", () => {
    test("should render the selected model name and version selector", () => {
      // GIVEN isLoading is false
      const givenIsLoading = false;
      // AND a list of models with fixed names so the snapshot is stable
      const givenModels = getArrayOfFakeModels(3);
      givenModels[0] = { ...givenModels[0], name: "Taxonomy for South Africa", version: "v1.0.1-rc.1" };
      givenModels[1] = { ...givenModels[1], name: "Taxonomy for South Africa", version: "v1.0.0" };
      givenModels[2] = { ...givenModels[2], name: "Tabiya esco-1.1.1", version: "v0.9.0" };
      // AND the first model is selected
      const givenSelectedModel = givenModels[0];

      // WHEN the component is rendered
      render(
        <ExplorerHeader
          isLoading={givenIsLoading}
          language="en"
          models={givenModels}
          selectedModel={givenSelectedModel}
          onModelChange={jest.fn()}
          {...givenActionHandlers()}
        />
      );

      // THEN expect no errors or warnings
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the model name is displayed
      const modelNameEl = screen.getByTestId(DATA_TEST_ID.MODEL_NAME);
      expect(modelNameEl).toBeInTheDocument();
      expect(modelNameEl).toHaveTextContent(givenSelectedModel.name);
      // AND the model selector is shown
      expect(screen.getByTestId(DATA_TEST_ID.MODEL_SELECT)).toBeInTheDocument();
      // AND the container matches the snapshot
      expect(screen.getByTestId(DATA_TEST_ID.CONTAINER)).toMatchSnapshot();
    });

    test("should call onModelChange with the selected model id when the user picks a different model", async () => {
      // GIVEN isLoading is false
      const givenIsLoading = false;
      // AND a list of models
      const givenModels = getArrayOfFakeModels(2);
      // AND the first model is selected
      const givenSelectedModel = givenModels[0];
      // AND an onModelChange handler
      const givenOnModelChange = jest.fn();

      // WHEN the component is rendered
      render(
        <ExplorerHeader
          isLoading={givenIsLoading}
          language="en"
          models={givenModels}
          selectedModel={givenSelectedModel}
          onModelChange={givenOnModelChange}
          {...givenActionHandlers()}
        />
      );

      // AND the user opens the selector by clicking the combobox trigger
      const combobox = within(screen.getByTestId(DATA_TEST_ID.MODEL_SELECT)).getByRole("combobox");
      await userEvent.click(combobox);

      // AND picks the second model from the listbox
      const listbox = await screen.findByRole("listbox");
      const options = within(listbox).getAllByRole("option");
      await userEvent.click(options[1]);

      // THEN onModelChange is called with the second model's id
      expect(givenOnModelChange).toHaveBeenCalledWith(givenModels[1].id);
    });

    test.each([
      ["back to directory", DATA_TEST_ID.BACK_LINK, "onBackToDirectory"],
      ["API docs", DATA_TEST_ID.API_BUTTON, "onOpenApiDocs"],
    ] as const)("should call %s handler when its control is clicked", async (_desc, testId, handlerKey) => {
      // GIVEN a selected model and action handlers
      const givenModels = getArrayOfFakeModels(1);
      const givenHandlers = givenActionHandlers();

      // WHEN the component is rendered
      render(
        <ExplorerHeader
          isLoading={false}
          language="en"
          models={givenModels}
          selectedModel={givenModels[0]}
          onModelChange={jest.fn()}
          {...givenHandlers}
        />
      );
      // AND the user clicks the control
      await userEvent.click(screen.getByTestId(testId));

      // THEN the matching handler is called
      expect(givenHandlers[handlerKey]).toHaveBeenCalledTimes(1);
    });

    test("should render the CSV button as a download link when an export is available", () => {
      // GIVEN a selected model and an available CSV export URL
      const givenModels = getArrayOfFakeModels(1);
      const givenCsvUrl = "https://example.com/exports/taxonomy-v1.csv";

      // WHEN the component is rendered with the download URL
      render(
        <ExplorerHeader
          isLoading={false}
          language="en"
          models={givenModels}
          selectedModel={givenModels[0]}
          onModelChange={jest.fn()}
          csvDownloadUrl={givenCsvUrl}
          {...givenActionHandlers()}
        />
      );

      // THEN the CSV button links to the export and downloads it, and is enabled
      const csvButton = screen.getByTestId(DATA_TEST_ID.CSV_BUTTON);
      expect(csvButton).toHaveAttribute("href", givenCsvUrl);
      expect(csvButton).toHaveAttribute("download", "taxonomy-v1.csv");
      expect(csvButton).not.toBeDisabled();
    });

    test("should disable the CSV button when no export is available", () => {
      // GIVEN a selected model without a CSV export URL
      const givenModels = getArrayOfFakeModels(1);

      // WHEN the component is rendered without a download URL
      render(
        <ExplorerHeader
          isLoading={false}
          language="en"
          models={givenModels}
          selectedModel={givenModels[0]}
          onModelChange={jest.fn()}
          {...givenActionHandlers()}
        />
      );

      // THEN the CSV button is disabled and has no href
      const csvButton = screen.getByTestId(DATA_TEST_ID.CSV_BUTTON);
      expect(csvButton).toBeDisabled();
      expect(csvButton).not.toHaveAttribute("href");
    });

    describe("language switcher", () => {
      test("should not render the language switcher when the model has a single language", () => {
        // GIVEN a model with a single available language
        const givenModels = getArrayOfFakeModels(1);

        // WHEN the component is rendered
        render(
          <ExplorerHeader
            isLoading={false}
            language="en"
            models={givenModels}
            selectedModel={givenModels[0]}
            onModelChange={jest.fn()}
            {...givenActionHandlers()}
          />
        );

        // THEN expect no errors or warnings
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
        // AND the language switcher is not rendered
        expect(screen.queryByTestId(DATA_TEST_ID.LANGUAGE_SELECT)).not.toBeInTheDocument();
      });

      test("should render the language switcher listing the model's available languages when it has more than one", async () => {
        // GIVEN a model with more than one available language
        const givenModels = getArrayOfFakeModels(2);
        const givenSelectedModel = givenModels[1];

        // WHEN the component is rendered with the first of those languages selected
        render(
          <ExplorerHeader
            isLoading={false}
            language={givenSelectedModel.availableLanguages[0]}
            models={givenModels}
            selectedModel={givenSelectedModel}
            onModelChange={jest.fn()}
            {...givenActionHandlers()}
          />
        );

        // THEN expect no errors or warnings
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
        // AND the language switcher is rendered, labelled for assistive technology
        const languageSelect = screen.getByTestId(DATA_TEST_ID.LANGUAGE_SELECT);
        expect(languageSelect).toBeInTheDocument();
        expect(within(languageSelect).getByRole("combobox")).toHaveAccessibleName(TEXT.SELECT_LANGUAGE);

        // AND opening it lists every one of the model's available languages by name
        await userEvent.click(within(languageSelect).getByRole("combobox"));
        const listbox = await screen.findByRole("listbox");
        const options = within(listbox).getAllByRole("option");
        expect(options).toHaveLength(givenSelectedModel.availableLanguages.length);
        expect(within(listbox).getByText("Français")).toBeInTheDocument();
      });

      test("should call onLanguageChange with the picked language's short code when the user picks a different language", async () => {
        // GIVEN a model with more than one available language, with the first one currently selected
        const givenModels = getArrayOfFakeModels(2);
        const givenSelectedModel = givenModels[1];
        const givenOnLanguageChange = jest.fn();

        // WHEN the component is rendered
        render(
          <ExplorerHeader
            isLoading={false}
            language={givenSelectedModel.availableLanguages[0]}
            models={givenModels}
            selectedModel={givenSelectedModel}
            onModelChange={jest.fn()}
            {...givenActionHandlers()}
            onLanguageChange={givenOnLanguageChange}
          />
        );

        // AND the user opens the language switcher and picks French
        const combobox = within(screen.getByTestId(DATA_TEST_ID.LANGUAGE_SELECT)).getByRole("combobox");
        await userEvent.click(combobox);
        const listbox = await screen.findByRole("listbox");
        await userEvent.click(within(listbox).getByText("Français"));

        // THEN onLanguageChange is called with French's short code
        expect(givenOnLanguageChange).toHaveBeenCalledWith("fr");
        // AND expect no errors or warnings
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
      });
    });
  });
});
