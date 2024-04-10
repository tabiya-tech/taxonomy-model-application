// mute the console
import "src/_test_utilities/consoleMock";

import ModelDirectoryHeader, { DATA_TEST_ID } from "./ModelDirectoryHeader";
import { render, screen } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import * as PrimaryButtonModule from "src/theme/PrimaryButton/PrimaryButton";
import { AuthContext, authContextDefaultValue, AuthContextValue } from "src/auth/AuthProvider";
import AuthAPISpecs from "api-specifications/auth";

describe("ModelDirectoryHeader", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render model directory header component", () => {
    // GIVEN an onModelImport callback function
    const givenOnModelImportCallback = () => undefined;
    // AND the import model loading state
    const givenIsImportModelLoading = false;

    // AND a model manager user
    const givenUser: AuthContextValue = {
      ...authContextDefaultValue,
      hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
    };

    jest.spyOn(PrimaryButtonModule, "default");

    // WHEN a ModelDirectoryHeader component is rendered
    render(
      <AuthContext.Provider value={givenUser}>
        <ModelDirectoryHeader
          onModelImport={givenOnModelImportCallback}
          isImportModelLoading={givenIsImportModelLoading}
        />
      </AuthContext.Provider>
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND specific elements to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_DIRECTORY_HEADER)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_DIRECTORY_TITLE)).toBeInTheDocument();
    // AND to match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_DIRECTORY_HEADER)).toMatchSnapshot();
    // AND the import button to be disabled when offline and not loading
    expect(PrimaryButtonModule.default as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        "data-testid": DATA_TEST_ID.IMPORT_MODEL_BUTTON,
        disableWhenOffline: true,
        disabled: false,
      }),
      {}
    );
  });

  test("should call onModelImport when import button is clicked", async () => {
    // GIVEN an onModelImport callback function
    const givenOnModelImportCallback = jest.fn();

    // AND a model manager user
    const givenUser: AuthContextValue = {
      ...authContextDefaultValue,
      hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
    };

    // WHEN a ModelDirectoryHeader component is rendered
    render(
      <AuthContext.Provider value={givenUser}>
        <ModelDirectoryHeader onModelImport={givenOnModelImportCallback} isImportModelLoading={false} />
      </AuthContext.Provider>
    );

    // AND the import button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON));

    // THEN expect the onModelImport callback to be triggered once
    expect(givenOnModelImportCallback).toHaveBeenCalledTimes(1);
  });

  test("should render import button when user have model manager role", () => {
    // GIVEN a model manager user
    const givenUser: AuthContextValue = {
      ...authContextDefaultValue,
      hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
    };

    // WHEN a ModelDirectoryHeader component is rendered
    render(
      <AuthContext.Provider value={givenUser}>
        <ModelDirectoryHeader onModelImport={() => undefined} isImportModelLoading={false} />
      </AuthContext.Provider>
    );

    // THEN expect the import button to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON)).toBeInTheDocument();
  });

  test("should not render import button when user does not have model manager role", () => {
    // GIVEN a non-model manager user
    const givenUser: AuthContextValue = {
      ...authContextDefaultValue,
      hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => role !== AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
    };

    // WHEN a ModelDirectoryHeader component is rendered
    render(
      <AuthContext.Provider value={givenUser}>
        <ModelDirectoryHeader onModelImport={() => undefined} isImportModelLoading={false} />
      </AuthContext.Provider>
    );

    // THEN expect the import button to not be present in the document
    expect(screen.queryByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON)).not.toBeInTheDocument();
  });

  test("should render loading spinner and disable the button when import model is loading", () => {
    // GIVEN a model manager user
    const givenUser: AuthContextValue = {
      ...authContextDefaultValue,
      hasRole: (role: AuthAPISpecs.Enums.TabiyaRoles) => role === AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
    };
    // AND an onModelImport callback function
    const givenOnModelImportCallback = jest.fn();
    // AND the import model loading state
    const givenIsImportModelLoading = true;

    jest.spyOn(PrimaryButtonModule, "default");

    // WHEN a ModelDirectoryHeader component is rendered
    render(
      <AuthContext.Provider value={givenUser}>
        <ModelDirectoryHeader
          onModelImport={givenOnModelImportCallback}
          isImportModelLoading={givenIsImportModelLoading}
        />
      </AuthContext.Provider>
    );

    // THEN expect the loading spinner to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON)).toContainHTML("CircularProgress");
    // AND the import button to be disabled
    expect(PrimaryButtonModule.default as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        "data-testid": DATA_TEST_ID.IMPORT_MODEL_BUTTON,
        disabled: true,
      }),
      {}
    );
  });
});
