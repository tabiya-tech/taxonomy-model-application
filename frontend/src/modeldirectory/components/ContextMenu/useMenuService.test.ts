import { act, renderHook } from "@testing-library/react";
import { useMenuService } from "./useMenuService";
import React from "react";
import { getOneRandomModelMaxLength } from "src/modeldirectory/components/modelTables/_test_utilities/mockModelData";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";

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
    expect(result.current.menuState.model).toBe(givenModel);
    // AND the anchorEl to be the given event target
    expect(result.current.menuState.anchorEl).toBe(givenEvent.currentTarget);

    // WHEN the function "closeMenu" is called
    act(() => {
      result.current.closeMenu();
    });

    // THEN expect the menu to be closed
    expect(result.current.menuState.open).toBe(false);
    // AND the menu to have no model
    expect(result.current.menuState.model).toBe(null);
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
  });
});
