// mute the console
import "src/_test_utilities/consoleMock";

import MenuBuilder, { DATA_TEST_ID } from "./MenuBuilder";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { render } from "src/_test_utilities/test-utils";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { getOneRandomModelMaxLength } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import { mockBrowserIsOnLine, unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";

describe("MenuBuilder", () => {
  const stdGivenProps = {
    open: true,
    anchorEl: document.createElement("div"), // Mock an HTMLElement
    model: null,
    notifyOnClose: jest.fn(),
  };

  describe("Render tests", () => {
    beforeEach(() => {
      unmockBrowserIsOnLine();
      (console.error as jest.Mock).mockClear();
      (console.warn as jest.Mock).mockClear();
    });

    test("render the menu visible", () => {
      // GIVEN some menu items
      const givenItems = [
        {
          text: "Item 1",
          icon: <div>icon1</div>,
          onClick: jest.fn(),
        },
        {
          text: "Item 2",
          icon: <div>icon2</div>,
          onClick: jest.fn(),
        },
      ];

      // WHEN the MenuBuilder is rendered
      render(<MenuBuilder {...stdGivenProps} items={givenItems} />);

      // THEN expect it to be shown
      const menuElement = screen.getByTestId(DATA_TEST_ID.MENU);
      expect(menuElement).toBeInTheDocument();

      // AND to have the correct number of items
      const menuItems = screen.getAllByTestId(DATA_TEST_ID.MENU_ITEM);
      expect(menuItems).toHaveLength(givenItems.length);
      // AND every item to have the correct text and icon
      menuItems.forEach((item, index) => {
        const itemTextElement = within(item).getByTestId(DATA_TEST_ID.MENU_ITEM_TEXT);
        expect(itemTextElement).toBeInTheDocument();
        expect(itemTextElement).toHaveTextContent(givenItems[index].text);
        // AND the icon to be present
        const itemIconElement = within(item).getByTestId(DATA_TEST_ID.MENU_ITEM_ICON);
        expect(itemIconElement).toBeInTheDocument();
      });
      // AND to match the snapshot
      expect(menuElement).toMatchSnapshot();
      // AND no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("renders the menu hidden", () => {
      // GIVEN some menu items
      const givenItems = [
        {
          text: "Item 1",
          icon: <div>icon1</div>,
          onClick: jest.fn(),
        },
        {
          text: "Item 2",
          icon: <div>icon2</div>,
          onClick: jest.fn(),
        },
      ];

      // WHEN the MenuBuilder is rendered
      render(<MenuBuilder {...stdGivenProps} items={givenItems} open={false} />);

      // THEN expect it to be hidden
      const menuElement = screen.queryByTestId(DATA_TEST_ID.MENU);
      expect(menuElement).not.toBeInTheDocument();
      // AND no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    describe("Browser offline/online tests", () => {
      test.each([
        [false, { disableWhenOffline: true, isOnline: true }],
        [true, { disableWhenOffline: true, isOnline: false }],
        [false, { disableWhenOffline: false, isOnline: true }],
        [false, { disableWhenOffline: false, isOnline: false }],
      ])(`renders the menu item disabled = %s when %j`, (expectedState, testCase) => {
        // GIVEN some menu items
        const givenItems = [
          {
            text: "Item 1",
            icon: <div>icon1</div>,
            onClick: jest.fn(),
            disableWhenOffline: testCase.disableWhenOffline,
          },
        ];
        // AND the browser is online/offline
        mockBrowserIsOnLine(testCase.isOnline);

        // WHEN the MenuBuilder is rendered
        render(<MenuBuilder {...stdGivenProps} items={givenItems} />);

        // THEN expect the menu item to be disabled
        const menuItem = screen.getByTestId(DATA_TEST_ID.MENU_ITEM);
        expect(menuItem).toBeInTheDocument();
        const matcher = expectedState ? "toBeDisabled" : "toBeEnabled";
        expect(menuItem)[matcher]();
        // AND no errors or warning to have occurred
        expect(console.error).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
      });

      test("renders the menu item enabled->disabled->enabled when online status changes and disableWhenOffline is true", async () => {
        // GIVEN that the internet status is online
        mockBrowserIsOnLine(true);
        // AND a menu item
        const givenItems = [
          {
            text: "Item 1",
            icon: <div>icon1</div>,
            onClick: jest.fn(),
            disableWhenOffline: true,
          },
        ];

        // WHEN the MenuBuilder is rendered
        render(<MenuBuilder {...stdGivenProps} items={givenItems} />);

        // THEN expect the menu item to be enabled
        const menuItem = screen.getByTestId(DATA_TEST_ID.MENU_ITEM);
        expect(menuItem).toBeEnabled();

        // WHEN the internet status changes to offline
        mockBrowserIsOnLine(false);

        // THEN expect the menu item to be disabled
        expect(menuItem).toBeDisabled();

        // WHEN the internet status changes back to online
        mockBrowserIsOnLine(true);

        // THEN expect the menu item to be enabled
        expect(menuItem).toBeEnabled();
      });
    });

    describe("Import process state successful/non-successful tests", () => {
      test.each([
        [true, ImportProcessStateAPISpecs.Enums.Status.PENDING, null],
        [true, ImportProcessStateAPISpecs.Enums.Status.RUNNING, null],
        [
          true,
          ImportProcessStateAPISpecs.Enums.Status.COMPLETED,
          {
            parsingErrors: false,
            parsingWarnings: false,
            errored: true,
          },
        ],
        [
          false,
          ImportProcessStateAPISpecs.Enums.Status.COMPLETED,
          {
            parsingErrors: true,
            parsingWarnings: false,
            errored: false,
          },
        ],
        [
          false,
          ImportProcessStateAPISpecs.Enums.Status.COMPLETED,
          {
            parsingErrors: false,
            parsingWarnings: true,
            errored: false,
          },
        ],
        [
          false,
          ImportProcessStateAPISpecs.Enums.Status.COMPLETED,
          {
            parsingErrors: true,
            parsingWarnings: true,
            errored: false,
          },
        ],
      ])(
        "renders the menu item disabled =  %s when the model import status is %d and the result %j",
        (expectedState, givenStatus, givenResult) => {
          // GIVEN some menu items
          const givenItems = [
            {
              text: "Item 1",
              icon: <div>icon1</div>,
              onClick: jest.fn(),
              disableOnNonSuccessfulImport: true,
            },
          ];
          // AND a model with the given status and result
          const givenModel = getOneRandomModelMaxLength();
          givenModel.importProcessState.status = givenStatus;
          if (givenResult) {
            givenModel.importProcessState.result = givenResult;
          }

          // WHEN the MenuBuilder is rendered
          render(<MenuBuilder {...stdGivenProps} items={givenItems} model={givenModel} />);

          // THEN expect the menu item to be disabled
          const menuItem = screen.getByTestId(DATA_TEST_ID.MENU_ITEM);
          expect(menuItem).toBeInTheDocument();
          const matcher = expectedState ? "toBeDisabled" : "toBeEnabled";
          expect(menuItem)[matcher]();
          // AND no errors or warning to have occurred
          expect(console.error).not.toHaveBeenCalled();
          expect(console.warn).not.toHaveBeenCalled();
        }
      );
    });

    describe("Browser offline/online and Import process state successful/non-successful tests", () => {
      const successfulResult = { errored: false, parsingErrors: false, parsingWarnings: false };
      const NonSuccessfulResult = { errored: true, parsingErrors: false, parsingWarnings: false };
      enum BROWSER_STATE {
        ONLINE = "online",
        OFFLINE = "offline",
      }
      enum IMPORT_STATE {
        SUCCESSFUL = "successful",
        NON_SUCCESSFUL = "nonSuccessful",
      }
      test.each([
        [true, BROWSER_STATE.OFFLINE, IMPORT_STATE.SUCCESSFUL],
        [true, BROWSER_STATE.OFFLINE, IMPORT_STATE.NON_SUCCESSFUL],
        [true, BROWSER_STATE.ONLINE, IMPORT_STATE.NON_SUCCESSFUL],
        [false, BROWSER_STATE.ONLINE, IMPORT_STATE.SUCCESSFUL],
      ])(
        `renders the menu item disabled =  %s when the browser is %s and the model import status is %s`,
        (expectedState, givenBrowserState, givenImportState) => {
          // GIVEN some menu items
          const givenItems = [
            {
              text: "Item 1",
              icon: <div>icon1</div>,
              onClick: jest.fn(),
              disableWhenOffline: true,
              disableOnNonSuccessfulImport: true,
            },
          ];
          // AND the browser is online/offline
          mockBrowserIsOnLine(givenBrowserState === BROWSER_STATE.ONLINE);
          // AND a model with the given status and result
          const givenModel = getOneRandomModelMaxLength();
          givenModel.importProcessState.status = ImportProcessStateAPISpecs.Enums.Status.COMPLETED;
          givenModel.importProcessState.result =
            givenImportState === IMPORT_STATE.SUCCESSFUL ? successfulResult : NonSuccessfulResult;

          // WHEN the MenuBuilder is rendered
          render(<MenuBuilder {...stdGivenProps} items={givenItems} model={givenModel} />);

          // THEN expect the menu item to be disabled
          const menuItem = screen.getByTestId(DATA_TEST_ID.MENU_ITEM);
          expect(menuItem).toBeInTheDocument();
          const matcher = expectedState ? "toBeDisabled" : "toBeEnabled";
          expect(menuItem)[matcher]();
          // AND no errors or warning to have occurred
          expect(console.error).not.toHaveBeenCalled();
          expect(console.warn).not.toHaveBeenCalled();
        }
      );
    });
  });

  describe("Action tests", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test("should call notifyOnClose then the menu item's onClick function with the modelId when the menu item is clicked", async () => {
      // GIVEN an onClick function for the menu item
      const givenOnClickFn = jest.fn();
      // AND some menu items
      const givenItems = [
        {
          text: "Item 1",
          icon: <div>icon1</div>,
          onClick: givenOnClickFn,
        },
      ];
      // AND a current model
      const givenModel = getOneRandomModelMaxLength();
      // AND the MenuBuilder is rendered
      render(<MenuBuilder {...stdGivenProps} items={givenItems} model={givenModel} />);

      // WHEN the menu item is clicked
      fireEvent.click(screen.getByTestId(DATA_TEST_ID.MENU_ITEM));

      // THEN expect the onClick function should be called
      expect(givenOnClickFn).toHaveBeenCalledWith(givenModel.id);

      // THEN the notifyOnClose should be called to close the menu
      await waitFor(() => expect(stdGivenProps.notifyOnClose).toHaveBeenCalled());
      // AND the onClick should be called after the menu is closed
      expect(givenOnClickFn).toHaveBeenCalledAfter(stdGivenProps.notifyOnClose);
    });

    test("should successfully close the menu when esc is pressed", async () => {
      // GIVEN that the menu is rendered
      render(<MenuBuilder {...stdGivenProps} items={[]} />);

      // WHEN the esc key is pressed
      const menuElement = screen.getByTestId(DATA_TEST_ID.MENU);
      fireEvent.keyDown(menuElement, { key: "Escape" });

      // THEN the notifyOnClose should be called to close the menu
      await waitFor(() => expect(stdGivenProps.notifyOnClose).toHaveBeenCalled());
    });
  });
});
