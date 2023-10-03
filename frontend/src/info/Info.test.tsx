// ##############################
// Setup info.service mock
// ##############################
import InfoService from "./info.service";
// ##############################

// mute the console
import 'src/_test_utilities/consoleMock';

import {InfoProps} from "./info.types";
import Info, {DATA_TEST_ID} from "./Info";
import { render, act, screen } from "src/_test_utilities/test-utils";

jest.mock("./info.service");

describe("Testing Info component", () => {

  test("it should show frontend and backend info successfully", async () => {
    // Clear any possible mock for the console
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();

    // GIVEN some frontend and backend info data are available and loaded
    const expectedFrontendInfoData: InfoProps = {
      date: "fooFrontend",
      branch: "barFrontend",
      buildNumber: "bazFrontend",
      sha: "gooFrontend"
    };
    const expectedBackendInfoData: InfoProps = {
      date: "fooBackend",
      branch: "barBackend",
      buildNumber: "bazBackend",
      sha: "gooBackend"
    };
    const infoDataPromise = Promise.resolve([expectedFrontendInfoData, expectedBackendInfoData]);

    // @ts-ignore
    InfoService.mockImplementationOnce(() => {
      return {
        loadInfo: () => {
          return infoDataPromise;
        },
      };
    });

    // WHEN the component is rendered
    render(<Info/>);
    await act(async () => {
      await infoDataPromise;
    });

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the frontend and backend info should be displayed
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONTEND_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONTEND_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_FRONTEND_ROOT);

    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_BACKEND_ROOT);
  });
});