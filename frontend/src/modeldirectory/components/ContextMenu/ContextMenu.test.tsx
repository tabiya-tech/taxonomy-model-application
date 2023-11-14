// mute the console
import "src/_test_utilities/consoleMock";

import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import ContextMenu, { ContextMenuProps, DATA_TEST_ID } from "./ContextMenu";
import { getOneRandomModelMaxLength } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";

describe("ContextMenu", () => {
  const stdGivenProps: ContextMenuProps = {
    anchorEl: document.createElement("div"), // Mock an HTMLElement
    model: getOneRandomModelMaxLength(),
    open: true,
    notifyOnClose: jest.fn(),
    notifyOnExport: jest.fn(),
  };

  describe("Render tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    test("should render the ContextMenu visible", () => {
      // WHEN the ContextMenu is rendered with the std given props
      render(<ContextMenu {...stdGivenProps} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the ContextMenu to be visible
      const actualMenu = screen.getByTestId(DATA_TEST_ID.CONTEXT_MENU);
      expect(actualMenu).toBeInTheDocument();
      // AND to match the snapshot
      expect(actualMenu).toMatchSnapshot();
      // AND the export menu item to be visible
      expect(screen.getByTestId(DATA_TEST_ID.MENU_ITEM_EXPORT)).toBeInTheDocument();
    });

    test("should render the ContextMenu hidden", () => {
      // WHEN the ContextMenu is rendered closed with the std given props
      render(<ContextMenu {...stdGivenProps} open={false} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the ContextMenu to be hidden
      const actualMenu = screen.queryByTestId(DATA_TEST_ID.CONTEXT_MENU);
      expect(actualMenu).not.toBeInTheDocument();
      // AND the export menu item to not be shown
      expect(screen.queryByTestId(DATA_TEST_ID.MENU_ITEM_EXPORT)).not.toBeInTheDocument();
    });
  });

  describe("Action tests", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test("should call notifyOnExport and notifyOnClose when the export menu item is clicked", async () => {
      // WHEN the ContextMenu is rendered with the std given props
      render(
        <ContextMenu
          {...stdGivenProps}
          model={{
            ...getOneRandomModelMaxLength(),
            importProcessState: {
              id: "some-id",
              status: ImportProcessStateAPISpecs.Enums.Status.COMPLETED,
              result: {
                parsingErrors: false,
                parsingWarnings: false,
                errored: false,
              },
            },
          }}
        />
      );

      // WHEN the menu item is clicked
      fireEvent.click(screen.getByTestId(DATA_TEST_ID.MENU_ITEM_EXPORT));

      // THEN the notifyOnClose should be called to close the menu
      await waitFor(() => expect(stdGivenProps.notifyOnClose).toHaveBeenCalled());
      // AND the notifyOnExport should be called after the menu is closed
      expect(stdGivenProps.notifyOnExport).toHaveBeenCalledAfter(stdGivenProps.notifyOnClose as jest.Mock);
    });

    test("on close the notifyOnClose should be called", () => {
      // GIVEN the ContextMenu is rendered with the std given props
      render(<ContextMenu {...stdGivenProps} />);

      // WHEN the use closed the menu ( by pressing the escape key )
      const actualMenu = screen.getByTestId(DATA_TEST_ID.CONTEXT_MENU);
      fireEvent.keyDown(actualMenu, { key: "Escape" });

      // THEN the notifyOnClose should be called to close the menu
      expect(stdGivenProps.notifyOnClose).toHaveBeenCalled();
      // AND the notifyOnExport should not be called
      expect(stdGivenProps.notifyOnExport).not.toHaveBeenCalled();
    });
  });
});
