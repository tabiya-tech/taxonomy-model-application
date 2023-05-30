// ##############################
// Setup info.service mock
// ##############################
import InfoService from "./info.service";
// ##############################

import {InfoProps} from "./info.types";
import Info from "./Info";
import {act, render, screen} from "@testing-library/react";
import {DATA_TEST_ID} from "./Info"
jest.mock("./info.service");

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
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONTEND_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONTEND_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_FRONTEND_ROOT);

    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_BACKEND_ROOT);
  });
});