import "_test_utilities/consoleMock";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { getIOccupationGroupMockData } from "../testDataHelper";
import * as sharedTransformModule from "esco/occupationGroup/_shared/transform";
import { transformPaginated } from "./response";

jest.mock("esco/occupationGroup/_shared/transform");

const mockTransform = jest.mocked(sharedTransformModule.transform);

describe("transformPaginated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should transform occupation groups and preserve pagination metadata", () => {
    const givenGroups = [getIOccupationGroupMockData(), getIOccupationGroupMockData()];
    const givenBasePath = "https://resources.example.com";
    const givenLimit = 25;
    const givenCursor = "cursor-token";

    mockTransform
      .mockReturnValueOnce({ id: "group-1" } as OccupationGroupAPISpecs.POST.Types.Response.Payload)
      .mockReturnValueOnce({ id: "group-2" } as OccupationGroupAPISpecs.POST.Types.Response.Payload);

    const actual = transformPaginated(givenGroups, givenBasePath, givenLimit, givenCursor);

    expect(mockTransform).toHaveBeenNthCalledWith(1, givenGroups[0], givenBasePath);
    expect(mockTransform).toHaveBeenNthCalledWith(2, givenGroups[1], givenBasePath);
    expect(actual).toEqual({
      data: [{ id: "group-1" }, { id: "group-2" }],
      limit: givenLimit,
      nextCursor: givenCursor,
    });
  });
});
