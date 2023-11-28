// mute the console
import "src/_test_utilities/consoleMock";

import { fireEvent, render, waitFor, screen, within } from "@testing-library/react";
import ContextMenu, { ContextMenuProps, DATA_TEST_ID } from "./ContextMenu";
import React from "react";
import { MenuItemConfig } from "./menuItemConfig.types";

describe("ContextMenu", () => {
  const stdGivenProps: ContextMenuProps = {
    anchorEl: document.createElement("div"), // Mock an HTMLElement
    open: true,
    notifyOnClose: jest.fn(),
    items: [],
  };

  describe("render tests", () => {
    test("renders correctly the menu open", () => {
      // GIVEN the following menu items
      const givenItems: MenuItemConfig[] = [
        // an enabled  menu item with an icon
        {
          id: "1",
          text: "foo",
          icon: <div />,
          disabled: false,
          action: jest.fn(),
        },
        // a menu item without an icon
        {
          id: "2",
          text: "bar",
          icon: undefined,
          disabled: false,
          action: jest.fn(),
        },
        // a disabled menu item
        {
          id: "3",
          text: "baz",
          icon: <div />,
          disabled: true,
          action: jest.fn(),
        },
      ];

      // WHEN the component is rendered with the given items and
      render(<ContextMenu {...stdGivenProps} items={givenItems} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the ContextMenu to be visible
      const actualMenu = screen.getByTestId(DATA_TEST_ID.MENU);
      expect(actualMenu).toBeInTheDocument();
      // AND the menu items to be visible
      const actualMenuItems = screen.getAllByTestId(DATA_TEST_ID.MENU_ITEM);
      expect(actualMenuItems).toHaveLength(givenItems.length);

      // AND every menu item
      actualMenuItems.forEach((menuItem, index) => {
        // to have the correct text in the right order
        const actualText = within(menuItem).getByTestId(DATA_TEST_ID.MENU_ITEM_TEXT);
        expect(actualText).toBeInTheDocument();
        expect(actualText.textContent).toEqual(givenItems[index].text);
      });

      // AND the menu item with the icon to have an icon
      const actualIcon = within(actualMenuItems[0]).getByTestId(DATA_TEST_ID.MENU_ITEM_ICON);
      expect(actualIcon).toBeInTheDocument();
      // AND the menu item without an icon to not have an icon
      const actualIcon2 = within(actualMenuItems[1]).queryByTestId(DATA_TEST_ID.MENU_ITEM_ICON);
      expect(actualIcon2).not.toBeInTheDocument();
      // AND the menu item with the enabled state to be enabled
      expect(actualMenuItems[0]).not.toHaveAttribute("aria-disabled", "true");
      // AND the menu item with the disabled state to be disabled
      expect(actualMenuItems[2]).toHaveAttribute("aria-disabled", "true");

      // AND to match the snapshot
      expect(actualMenu).toMatchSnapshot();
    });

    test("renders correctly the menu closed", () => {
      // GIVEN that the menu is closed
      const givenProps = { ...stdGivenProps, open: false };

      // WHEN the component is rendered
      render(<ContextMenu {...givenProps} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the ContextMenu to not be shown
      const actualMenu = screen.queryByTestId(DATA_TEST_ID.MENU);
      expect(actualMenu).not.toBeInTheDocument();
    });
  });

  describe("action tests", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test("on click on a menu item, the notifyOnClose and then the item's action are called", async () => {
      // GIVEN some menu items
      const givenItems: MenuItemConfig[] = [
        {
          id: "1",
          text: "foo",
          icon: <div />,
          disabled: false,
          action: jest.fn(),
        },
        {
          id: "2",
          text: "bar",
          icon: <div />,
          disabled: false,
          action: jest.fn(),
        },
      ];

      // WHEN the component is rendered
      render(<ContextMenu {...stdGivenProps} items={givenItems} />);
      // AND the user clicks on the first menu item
      const actualMenuItem = screen.getAllByTestId(DATA_TEST_ID.MENU_ITEM)[0];
      fireEvent.click(actualMenuItem);

      // THEN expect the notifyOnClose to be called first
      await waitFor(() => expect(stdGivenProps.notifyOnClose).toHaveBeenCalled());
      // AND the action of the clicked  menu item to be called
      expect(givenItems[0].action).toHaveBeenCalledAfter(stdGivenProps.notifyOnClose as jest.Mock);
      // AND the action of the second menu item to not be called
      expect(givenItems[1].action).not.toHaveBeenCalled();
    });

    test("on close the notifyOnClose should be called", () => {
      // GIVEN the ContextMenu is rendered with the std given props
      render(<ContextMenu {...stdGivenProps} />);

      // WHEN the use closed the menu ( by pressing the escape key )
      const actualMenu = screen.getByTestId(DATA_TEST_ID.MENU);
      fireEvent.keyDown(actualMenu, { key: "Escape" });

      // THEN the notifyOnClose should be called to close the menu
      expect(stdGivenProps.notifyOnClose).toHaveBeenCalled();
    });
  });
});
