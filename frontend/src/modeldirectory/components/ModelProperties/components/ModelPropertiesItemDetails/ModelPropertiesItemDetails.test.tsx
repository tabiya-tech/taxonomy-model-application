// mute the console
import "src/_test_utilities/consoleMock";

import ModelPropertiesItemDetails, { DATA_TEST_ID } from "./ModelPropertiesItemDetails";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { render } from "src/_test_utilities/test-utils";
import { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";

// mock the snackbar
jest.mock("src/theme/SnackbarProvider/SnackbarProvider", () => {
  const actual = jest.requireActual("src/theme/SnackbarProvider/SnackbarProvider");
  return {
    ...actual,
    __esModule: true,
    useSnackbar: jest.fn().mockReturnValue({
      enqueueSnackbar: jest.fn(),
      closeSnackbar: jest.fn(),
    }),
  };
});

describe("ItemDetails", () => {
  describe("render tests", () => {
    test("should render with provided title and value", () => {
      // GIVEN an item with a title and a value
      const givenItem = {
        title: "foo",
        value: "bar",
      };

      const givenDataTestId = "item-details";

      // WHEN the component is rendered
      render(<ModelPropertiesItemDetails {...givenItem} data-testid={givenDataTestId} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the component to be displayed
      const itemDetailsElement = screen.getByTestId(givenDataTestId);
      expect(itemDetailsElement).toBeInTheDocument();
      // AND the given item's title to be displayed
      const titleElement = within(itemDetailsElement).getByTestId(DATA_TEST_ID.ITEM_TITLE);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(givenItem.title);
      // AND the given item's value to be displayed
      const valueElement = within(itemDetailsElement).getByTestId(DATA_TEST_ID.ITEM_VALUE);
      expect(valueElement).toBeInTheDocument();
      expect(valueElement).toHaveTextContent(givenItem.value);
      // AND the copy to clipboard button not to be displayed
      const copyButtonElement = within(valueElement).queryByTestId(DATA_TEST_ID.ITEM_COPY_BUTTON);
      expect(copyButtonElement).not.toBeInTheDocument();
      // AND the component to match the snapshot
      expect(itemDetailsElement).toMatchSnapshot();
    });

    test("should display a copy to clipboard button when the isCopyEnabled prop is true", () => {
      // GIVEN an item with a title and a value
      const givenItem = {
        title: "foo",
        value: "bar",
      };

      const givenDataTestId = "item-details";

      // WHEN the component is rendered with the isCopyEnabled prop set to true
      render(<ModelPropertiesItemDetails {...givenItem} isCopyEnabled={true} data-testid={givenDataTestId} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the component to be displayed
      const itemDetailsElement = screen.getByTestId(givenDataTestId);
      expect(itemDetailsElement).toBeInTheDocument();
      // AND the given item's title to be displayed
      const titleElement = within(itemDetailsElement).getByTestId(DATA_TEST_ID.ITEM_TITLE);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(givenItem.title);
      // AND the given item's value to be displayed
      const valueElement = within(itemDetailsElement).getByTestId(DATA_TEST_ID.ITEM_VALUE);
      expect(valueElement).toBeInTheDocument();
      expect(valueElement).toHaveTextContent(givenItem.value);
      // AND the copy to clipboard button to be displayed
      const copyButtonElement = within(itemDetailsElement).getByTestId(DATA_TEST_ID.ITEM_COPY_BUTTON);
      expect(copyButtonElement).toBeInTheDocument();
      // AND the component to match the snapshot
      expect(itemDetailsElement).toMatchSnapshot();
    });
  });

  describe("action tests", () => {
    test("should copy the value to the clipboard when the copy to clipboard button is clicked", async () => {
      // Ensure navigator.clipboard is defined since jest/jsdom does natively implement it
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: jest.fn(),
        },
      });
      // Define writeText as a function if it's not already defined
      if (!navigator.clipboard.writeText) {
        navigator.clipboard.writeText = jest.fn();
      }
      const mockClipboardWriteText = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

      // GIVEN an item with a title and a value
      const givenItem = {
        title: "foo",
        value: "bar",
      };
      // AND the component is rendered with the isCopyEnabled prop set to true
      render(<ModelPropertiesItemDetails {...givenItem} isCopyEnabled={true} data-testid={"item-details"} />);

      // WHEN the copy to clipboard button is clicked
      const copyButtonElement = screen.getByTestId(DATA_TEST_ID.ITEM_COPY_BUTTON);
      fireEvent.click(copyButtonElement);

      // THEN expect the value to be copied to the clipboard
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(givenItem.value);
      await waitFor(() => expect(mockClipboardWriteText).toHaveBeenCalledWith(givenItem.value));
      await waitFor(() => {
        // AND expect a snackbar with a message to be shown
        expect(useSnackbar().enqueueSnackbar).toHaveBeenCalledWith("Copied to clipboard", {
          variant: "success",
          preventDuplicate: true,
        });
      });
    });
  });
});
