// ##############################
// Setup info.service mock
// ##############################
import InfoService from "./info.service";
// ##############################

// mute the console
import "src/_test_utilities/consoleMock";

import { InfoProps } from "./info.types";
import Info, { DATA_TEST_ID } from "./Info";
import { render, act, screen } from "src/_test_utilities/test-utils";
import { mockBrowserIsOnLine, unmockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";
import { ALL_USERS, authorizationTests } from "src/_test_utilities/authorizationTests";

jest.mock("./info.service", () => {
  const mockInfoService = jest.fn();
  mockInfoService.prototype.loadInfo = jest.fn().mockImplementation(() => {
    return Promise.resolve([]);
  });
  return mockInfoService;
});

describe("Testing Info component", () => {
  beforeEach(() => {
    unmockBrowserIsOnLine();
  });

  test("it should show frontend and backend info successfully", async () => {
    // Clear any possible mock for the console
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();

    // GIVEN some frontend and backend info data are available and loaded
    const expectedFrontendInfoData: InfoProps = {
      date: "fooFrontend",
      version: "barFrontend",
      buildNumber: "bazFrontend",
      sha: "gooFrontend",
    };
    const expectedBackendInfoData: InfoProps = {
      date: "fooBackend",
      version: "barBackend",
      buildNumber: "bazBackend",
      sha: "gooBackend",
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
    render(<Info />);
    await act(async () => {
      await infoDataPromise;
    });

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component should be rendered
    expect(screen.getByTestId(DATA_TEST_ID.INFO_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.INFO_ROOT)).toMatchSnapshot(DATA_TEST_ID.INFO_ROOT);
    // AND the frontend info should be displayed
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONTEND_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_FRONTEND_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_FRONTEND_ROOT);
    // AND the backend info should be displayed
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toBeDefined();
    expect(screen.getByTestId(DATA_TEST_ID.VERSION_BACKEND_ROOT)).toMatchSnapshot(DATA_TEST_ID.VERSION_BACKEND_ROOT);
  });

  test("should fetch data when the internet switches from offline to online", async () => {
    // Testing the following scenario:
    // before render -> offline -> render -> online -> offline -> online// ... // -> offline + online // ...
    // GIVEN the internet is offline
    mockBrowserIsOnLine(false);
    // AND the component is rendered
    render(<Info />);

    // THEN the info service should not be called
    expect(InfoService.prototype.loadInfo).not.toHaveBeenCalled();

    // AND WHEN the internet goes online
    mockBrowserIsOnLine(true);
    // THEN the info service should be called
    expect(InfoService.prototype.loadInfo).toHaveBeenCalledTimes(1);

    // AND WHEN the internet goes offline
    mockBrowserIsOnLine(false);
    // THEN the info service should not be called again
    expect(InfoService.prototype.loadInfo).toHaveBeenCalledTimes(1);

    // AND WHEN the internet goes online
    mockBrowserIsOnLine(true);
    // THEN the info service should be called again
    expect(InfoService.prototype.loadInfo).toHaveBeenCalledTimes(2);
  });

  describe(
    // eslint-disable-next-line jest/valid-describe-callback,jest/valid-title
    authorizationTests.defaultName,
    authorizationTests.callback({
      name: "InfoComponent",
      Component: <Info />,
      roles: ALL_USERS,
      testIds: [DATA_TEST_ID.INFO_ROOT, DATA_TEST_ID.VERSION_FRONTEND_ROOT, DATA_TEST_ID.VERSION_BACKEND_ROOT],
    })
  );
});
