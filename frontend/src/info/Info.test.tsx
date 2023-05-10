// ##############################
// Setup info.service mock
// ##############################
import InfoService from "./info.service";
jest.mock("./info.service");
// ##############################

import {InfoProps} from "./info.types";
import Info from "./Info";
import {act, render, screen} from "@testing-library/react";
import {DATA_TEST_ID} from "./Info"

describe("Testing Info component", () => {

  test("it should show frontend and backend info successfully", async () => {
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

    // THEN the frontend and backend info should be displayed
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONT_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONT_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_FRONT_ROOT);

    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_BACKEND_ROOT);
  });

  xtest("it should show some progress while data are loading", () => {
    // TO BE IMPLEMENTED
  });

  xtest("it should show some notification if fetching of the data fails", () => {
    // TO BE IMPLEMENTED
  });
});