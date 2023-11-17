import { act, renderHook, waitFor } from "@testing-library/react";
import { useMenuService } from "./useMenuService";
import React from "react";
import { getOneRandomModelMaxLength } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { IsOnlineContext } from "src/app/providers";

describe("useMenuService", () => {
  test("should open and close the menu correctly", () => {
    // GIVEN a model
    const givenModel = getOneRandomModelMaxLength();
    // AND the hook "useMenuService" is used
    const { result, unmount } = renderHook(() => useMenuService());
    // AND the event that will open the menu
    const givenEvent = new MouseEvent("click") as unknown as React.MouseEvent<HTMLButtonElement>;

    // THEN expect the menu to be closed
    expect(result.current.menuState.open).toBe(false);

    // WHEN the function "openMenu" is called
    act(() => {
      result.current.openMenu(givenEvent, givenModel);
    });

    // THEN expect the menu to be open
    expect(result.current.menuState.open).toBe(true);
    // AND the menu to have the correct model
    expect(result.current.model).toBe(givenModel);
    // AND the anchorEl to be the given event target
    expect(result.current.menuState.anchorEl).toBe(givenEvent.currentTarget);

    // WHEN the function "closeMenu" is called
    act(() => {
      result.current.closeMenu();
    });

    // THEN expect the menu to be closed
    expect(result.current.menuState.open).toBe(false);
    // AND the menu to have no model
    expect(result.current.model).toBe(null);
    // AND the anchorEl to be null
    expect(result.current.menuState.anchorEl).toBe(null);

    // CLEANUP
    unmount();
  });

  describe("isExportDisabled tests", () => {
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
      "should set to %s when the model import status is %s and the result %s",
      (givenValue, givenStatus, givenResult) => {
        // GIVEN model with the given status and result
        const givenModel = getOneRandomModelMaxLength();
        givenModel.importProcessState.status = givenStatus;
        if (givenResult) {
          givenModel.importProcessState.result = givenResult;
        }
        // AND the hook "useMenuService" is used
        const { result, unmount } = renderHook(() => useMenuService());

        // WHEN the function "openMenu" is called
        act(() => {
          result.current.openMenu(
            new MouseEvent("click") as unknown as React.MouseEvent<HTMLButtonElement>,
            givenModel
          );
        });

        // THEN expect the state "isExportDisabled" to be set to the given value
        expect(result.current.menuState.isExportDisabled).toBe(givenValue);

        // CLEANUP
        unmount();
      }
    );

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
    describe.each([
      [BROWSER_STATE.OFFLINE, IMPORT_STATE.SUCCESSFUL, true],
      [BROWSER_STATE.OFFLINE, IMPORT_STATE.NON_SUCCESSFUL, true],
      [BROWSER_STATE.ONLINE, IMPORT_STATE.NON_SUCCESSFUL, true],
      [BROWSER_STATE.ONLINE, IMPORT_STATE.SUCCESSFUL, false],
    ])("online/offline", (browserState, importState, value) => {
      test(`should set to ${value} when the browser is ${browserState} and the model import status is ${importState}`, () => {
        // GIVEN that the browser is offline/online
        mockIsOnlineContext(browserState === BROWSER_STATE.ONLINE);
        // AND a model with the given import state
        const givenModel = getOneRandomModelMaxLength();
        givenModel.importProcessState.status = ImportProcessStateAPISpecs.Enums.Status.COMPLETED;
        if (importState === IMPORT_STATE.SUCCESSFUL) {
          givenModel.importProcessState.result = successfulResult;
        } else {
          givenModel.importProcessState.result = NonSuccessfulResult;
        }

        // WHEN the hook "useMenuService" is used
        const { result, unmount } = renderHook(() => useMenuService());
        // AND the function "openMenu" is called
        act(() => {
          result.current.openMenu(
            new MouseEvent("click") as unknown as React.MouseEvent<HTMLButtonElement>,
            givenModel
          );
        });

        // THEN expect the state "isExportDisabled" to be set to true
        expect(result.current.menuState.isExportDisabled).toBe(value);

        // CLEANUP
        unmount();
      });
    });

    test("should render enable->disabled->enabled when online status changes", async () => {
      // GIVEN that the internet status is online
      mockIsOnlineContext(true);
      // AND a model with a successful import state
      const givenModel = getOneRandomModelMaxLength();
      givenModel.importProcessState.status = ImportProcessStateAPISpecs.Enums.Status.COMPLETED;
      givenModel.importProcessState.result = successfulResult;

      // WHEN the hook "useMenuService" is used
      const { result, unmount, rerender } = renderHook(() => useMenuService());
      // AND the function "openMenu" is called
      act(() => {
        result.current.openMenu(new MouseEvent("click") as unknown as React.MouseEvent<HTMLButtonElement>, givenModel);
      });

      // THEN expect the state "isExportDisabled" to be set to false
      expect(result.current.menuState.isExportDisabled).toBe(false);

      // WHEN the internet status changes to offline
      mockIsOnlineContext(false);
      rerender();

      // THEN expect the state "isExportDisabled" to be set to true
      await waitFor(() => {
        expect(result.current.menuState.isExportDisabled).toBe(true);
      });

      // WHEN the internet status changes back to online
      mockIsOnlineContext(true);
      rerender();

      // THEN expect the state "isExportDisabled" to be set to false
      expect(result.current.menuState.isExportDisabled).toBe(false);

      // CLEANUP
      unmount();
    });
  });
});

function mockIsOnlineContext(isOnline: boolean) {
  jest.spyOn(React, "useContext").mockImplementation((ctx: React.Context<unknown>) => {
    const actual = jest.requireActual("react");
    if (ctx === IsOnlineContext) {
      return isOnline;
    }
    return actual.useContext(ctx);
  });
}
