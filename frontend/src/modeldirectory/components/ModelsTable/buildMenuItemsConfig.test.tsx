import { getOneRandomModelMaxLength } from "./_test_utilities/mockModelData";
import buildMenuItemsConfig, { MENU_ITEM_ID, MENU_ITEM_INDEX, MENU_ITEM_TEXT } from "./buildMenuItemsConfig";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { getAllImportProcessStatePermutations } from "src/modeldirectory/components/ImportProcessStateIcon/_test_utilities/importProcesStateTestData";
import AuthAPISpecs from "api-specifications/auth";

describe("buildMenuItemsConfig", () => {
  test("should return all items when user has model manager role", () => {
    // WHEN the function is called with some model, handleExport function and isOnline (true/false we don't care)
    // AND the user has model manager role
    const hasRole = (role: AuthAPISpecs.Enums.TabiyaRoles) => role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;
    const actualItems = buildMenuItemsConfig(
      getOneRandomModelMaxLength(),
      { handleExport: jest.fn(), handleShowModelDetails: jest.fn },
      true,
      hasRole
    );

    // THEN expect all the items to be returned
    expect(actualItems).toHaveLength(Object.keys(MENU_ITEM_INDEX).length);
    Object.values(MENU_ITEM_INDEX).forEach((index) => {
      expect(actualItems[index]).toEqual({
        id: MENU_ITEM_ID[index],
        text: MENU_ITEM_TEXT[index],
        icon: expect.anything(),
        action: expect.any(Function),
        disabled: expect.any(Boolean),
        role: index === MENU_ITEM_INDEX.EXPORT_MODEL ? AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER : undefined,
      });
    });
  });

  test("should not return export item when user does not have model manager role", () => {
    // WHEN the function is called with some model, handleExport function and isOnline (true/false we don't care)
    // AND the user does not have model manager role
    const hasRole = (role: AuthAPISpecs.Enums.TabiyaRoles) => role !== AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;
    const actualItems = buildMenuItemsConfig(
      getOneRandomModelMaxLength(),
      { handleExport: jest.fn(), handleShowModelDetails: jest.fn },
      true,
      hasRole
    );

    // THEN expect all the items to be returned except the export item
    expect(actualItems).toHaveLength(Object.keys(MENU_ITEM_INDEX).length - 1);
    expect(actualItems).not.toContainEqual(expect.objectContaining({ id: MENU_ITEM_ID[MENU_ITEM_INDEX.EXPORT_MODEL] }));
  });

  describe("export item tests", () => {
    // GIVEN a user has model manager role
    const hasRole = (role: AuthAPISpecs.Enums.TabiyaRoles) => role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;

    describe.each(getAllImportProcessStatePermutations())(
      "export item is disabled when isOnline is false no matter the import state",
      (givenImportState) => {
        test(`export item is disabled when isOnline is false and import state is: ${JSON.stringify(
          givenImportState
        )}`, () => {
          // GIVEN a model with the given import state
          const givenModel = getOneRandomModelMaxLength();
          givenModel.importProcessState = givenImportState;

          // WHEN the function is called with isOnline = false
          const actualItems = buildMenuItemsConfig(
            givenModel,
            { handleExport: jest.fn(), handleShowModelDetails: jest.fn },
            false,
            hasRole
          );

          // THEN expect the export item to be returned with disabled = true
          expect(actualItems[MENU_ITEM_INDEX.EXPORT_MODEL]).toEqual({
            id: MENU_ITEM_ID[MENU_ITEM_INDEX.EXPORT_MODEL],
            text: MENU_ITEM_TEXT[MENU_ITEM_INDEX.EXPORT_MODEL],
            icon: expect.anything(),
            action: expect.any(Function),
            disabled: true,
            role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
          });
        });
      }
    );

    describe.each(
      getAllImportProcessStatePermutations().filter(
        (state) => state.status === ImportProcessStateAPISpecs.Enums.Status.COMPLETED && !state.result.errored
      )
    )(
      "export item is enabled when isOnline is true and import status is (COMPLETED and not errored)",
      (givenImportState) => {
        test(`export item is enabled when isOnline is true and import status is: ${JSON.stringify(
          givenImportState
        )}`, () => {
          // GIVEN a model with the given import state
          const givenModel = getOneRandomModelMaxLength();
          givenModel.importProcessState = givenImportState;

          // WHEN the function is called with isOnline = true
          const actualItems = buildMenuItemsConfig(
            givenModel,
            { handleExport: jest.fn(), handleShowModelDetails: jest.fn },
            true,
            hasRole
          );

          // THEN expect the export item to be returned with disabled = false
          expect(actualItems).toHaveLength(Object.keys(MENU_ITEM_INDEX).length);
          Object.values(MENU_ITEM_INDEX).forEach((index) => {
            expect(actualItems[index]).toEqual({
              id: MENU_ITEM_ID[index],
              text: MENU_ITEM_TEXT[index],
              icon: expect.anything(),
              action: expect.any(Function),
              disabled: false,
              role: index === MENU_ITEM_INDEX.EXPORT_MODEL ? AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER : undefined,
            });
          });
        });
      }
    );

    describe.each(
      getAllImportProcessStatePermutations().filter(
        (state) => !(state.status === ImportProcessStateAPISpecs.Enums.Status.COMPLETED && !state.result.errored)
      )
    )(
      "export item is disabled when isOnline is true and import status is not (COMPLETED and not errored)",
      (givenImportState) => {
        test(`export item is disabled when isOnline is true and import status is: ${JSON.stringify(
          givenImportState
        )}`, () => {
          // GIVEN a model with the given import state
          const givenModel = getOneRandomModelMaxLength();
          givenModel.importProcessState = givenImportState;

          // WHEN the function is called with isOnline = true
          const actualItems = buildMenuItemsConfig(
            givenModel,
            { handleExport: jest.fn(), handleShowModelDetails: jest.fn },
            true,
            hasRole
          );

          // THEN expect all the items to be returned with disabled = true
          expect(actualItems[MENU_ITEM_INDEX.EXPORT_MODEL]).toEqual({
            id: MENU_ITEM_ID[MENU_ITEM_INDEX.EXPORT_MODEL],
            text: MENU_ITEM_TEXT[MENU_ITEM_INDEX.EXPORT_MODEL],
            icon: expect.anything(),
            action: expect.any(Function),
            disabled: true,
            role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
          });
        });
      }
    );
  });

  describe("action tests", () => {
    test("calls handleExport with the model id when the export item action is called", () => {
      // GIVEN a model
      const givenModel = getOneRandomModelMaxLength();
      // AND a handleExport function
      const givenHandleExport = jest.fn();
      const givenHandleShowModelProperties = jest.fn();
      // AND a user has model manager role
      const hasRole = (role: AuthAPISpecs.Enums.TabiyaRoles) => role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER;

      // AND a built MenuItems Config based on the model and handleExport function
      const givenMenuItems = buildMenuItemsConfig(
        givenModel,
        { handleExport: givenHandleExport, handleShowModelDetails: givenHandleShowModelProperties },
        true,
        hasRole
      );

      // WHEN the action of the export menu item is called
      givenMenuItems[MENU_ITEM_INDEX.EXPORT_MODEL].action();

      // THEN expect the handleExport function to have been called with the model id
      expect(givenHandleExport).toHaveBeenCalledTimes(1);
      expect(givenHandleExport).toHaveBeenCalledWith(givenModel.id);
      // AND expect the handleShowModelProperties function to not have been called
      expect(givenHandleShowModelProperties).not.toHaveBeenCalled();
    });

    test("calls handleShowModelDetails with the model id when the show model details item action is called", () => {
      // GIVEN a model
      const givenModel = getOneRandomModelMaxLength();
      // AND a handleShowModelProperties function
      const givenHandleExport = jest.fn();
      const givenHandleShowModelProperties = jest.fn();

      // AND a built MenuItems Config based on the model and handleShowModelProperties function
      const givenMenuItems = buildMenuItemsConfig(
        givenModel,
        { handleExport: givenHandleExport, handleShowModelDetails: givenHandleShowModelProperties },
        true,
        () => true
      );

      // WHEN the action of the show model details menu item is called
      givenMenuItems[MENU_ITEM_INDEX.SHOW_MODEL_DETAILS].action();

      // THEN expect the handleShowModelProperties function to have been called with the model id
      expect(givenHandleShowModelProperties).toHaveBeenCalledTimes(1);
      expect(givenHandleShowModelProperties).toHaveBeenCalledWith(givenModel.id);
      // AND expect the handleExport function to not have been called
      expect(givenHandleExport).not.toHaveBeenCalled();
    });
  });
});
