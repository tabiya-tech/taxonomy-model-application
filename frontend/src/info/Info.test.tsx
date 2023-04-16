// ##############################
// Setup info.service mock
// ##############################
import InfoService from "./info.service";
jest.mock("./info.service");
// ##############################

import {InfoProps} from "./info.types";
import Info from "./Info";
import {act, render, screen} from "@testing-library/react";

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
    expect(screen.getByTestId('frontend')).toBeDefined();
    expect(screen.getByTestId('frontend')).toMatchSnapshot("frontend");

    expect(screen.getByTestId('backend')).toBeDefined();
    expect(screen.getByTestId('backend')).toMatchSnapshot("backend");
  });

  xtest("it should show some progress while data are loading", () => {
    // TO BE IMPLEMENTED
  });

  xtest("it should show some notification if fetching of the data fails", () => {
    // TO BE IMPLEMENTED
  });
});