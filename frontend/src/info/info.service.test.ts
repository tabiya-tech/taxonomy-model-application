import { InfoProps } from "src/info/info.types";
import InfoService from "src/info/info.service";
import infoURL from "./info.constants";

const anonymousFetchOptions = {
  headers: { map: {} },
};

describe("InfoService", () => {
  describe("Test the loadInfoFromUrl function", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    function setupFetchMock(expectedBody: any): jest.Mock {
      const expectedResponse = new Response(expectedBody);
      const mockFetch = jest.fn().mockResolvedValueOnce(expectedResponse);
      jest.spyOn(window, "fetch").mockImplementation(mockFetch);
      return mockFetch;
    }

    test("should fetch and return the infoProps object from the provided URL", async () => {
      // GIVEN some URL that returns some info data structure
      const someURL: string = "url";
      const expectedData: InfoProps = {
        date: "foo",
        version: "bar",
        buildNumber: "baz",
        sha: "goo",
      };
      const mockFetch = setupFetchMock(JSON.stringify(expectedData));

      // WHEN the loadInfoFromUrl function is called for that URL
      const service = new InfoService();
      const actualResult = await service.loadInfoFromUrl(someURL);

      // THEN it returns that data structure from the given url
      expect(mockFetch).toHaveBeenCalledWith(someURL, anonymousFetchOptions);
      expect(actualResult).toMatchObject(expectedData);
    });

    test("should return an info object with empty values when the fetched data is a malformed json", async () => {
      // GIVEN some URL that returns some info data structure
      const someURL: string = "url";
      const malformedJSON: string = "{";
      const mockFetch = setupFetchMock(malformedJSON);

      // WHEN the loadInfoFromUrl function is called for that URL
      const service = new InfoService();
      const actualResult = await service.loadInfoFromUrl(someURL);

      // THEN it returns info object with empty values
      expect(mockFetch).toHaveBeenCalledWith(someURL, anonymousFetchOptions);
      expect(actualResult).toMatchObject({ date: "", version: "", buildNumber: "", sha: "" });
    });

    test.each([{}, { foo: "bar" }, null])(
      "should return an info object with empty values when the fetched data is not a valid info data json structure: '%s'",
      async (jsonData) => {
        // GIVEN some URL that returns some info data structure
        const someURL: string = "url";
        const mockFetch = setupFetchMock(JSON.stringify(jsonData));

        // WHEN the loadInfoFromUrl function is called for that URL
        const service = new InfoService();
        const actualResult = await service.loadInfoFromUrl(someURL);

        // THEN it returns info object with empty values
        expect(mockFetch).toHaveBeenCalledWith(someURL, anonymousFetchOptions);
        expect(actualResult).toMatchObject({ date: "", version: "", buildNumber: "", sha: "" });
      }
    );

    test("should return an info object with empty values when the fetching the data fails with a HTTP error", async () => {
      // GIVEN some URL that fails with an HTTP error
      const someURL: string = "url";
      const expectedResponse = new Response(
        JSON.stringify({
          reason: "some reason",
          detail: "some detail",
        }),
        { status: 500 }
      );
      const mockFetch = jest.fn().mockRejectedValueOnce(expectedResponse);
      jest.spyOn(window, "fetch").mockImplementation(mockFetch);

      // WHEN the loadInfoFromUrl function is called for that URL
      const service = new InfoService();
      const actualResult = await service.loadInfoFromUrl(someURL);

      // THEN it returns info object with empty values
      expect(mockFetch).toHaveBeenCalledWith(someURL, anonymousFetchOptions);
      expect(actualResult).toMatchObject({ date: "", version: "", buildNumber: "", sha: "" });
    });
  });
  describe("Test the loadInfo function", () => {
    test("should fetch and return the frontend and backend info data", async () => {
      // GIVEN the backend info url responds with the expected backend info data
      // AND the frontend info url responds with the expected frontend info data
      const service = new InfoService();
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

      jest.spyOn(service, "loadInfoFromUrl").mockImplementation((url: string) => {
        if (url === infoURL.frontend) {
          return Promise.resolve(expectedFrontendInfoData);
        } else if (url === infoURL.backend) {
          return Promise.resolve(expectedBackendInfoData);
        } else {
          return Promise.reject(new Error("Unexpected url"));
        }
      });
      // WHEN the loadInfo function is called
      // THEN it returns the expected frontend and backend info data in the expected order
      await expect(service.loadInfo()).resolves.toMatchObject([expectedFrontendInfoData, expectedBackendInfoData]);
    });

    test("should call the correct frontend and backend urls", async () => {
      // WHEN the loadInfo function is called
      const service = new InfoService();
      jest.spyOn(service, "loadInfoFromUrl").mockImplementation(() =>
        Promise.resolve({
          date: "",
          version: "",
          buildNumber: "",
          sha: "",
        })
      );
      await service.loadInfo();
      // THEN it calls the correct frontend and backend urls
      expect(service.loadInfoFromUrl).toHaveBeenCalledWith(infoURL.frontend);
      expect(service.loadInfoFromUrl).toHaveBeenCalledWith(infoURL.backend);
    });
  });
});
