import "_test_utilities/consoleMock";

import { getIOccupationGroupMockData } from "../_shared/testDataHelper";
import * as sharedTransformModule from "esco/occupationGroup/_shared/transform";
import { transform } from "./response";

jest.mock("esco/occupationGroup/_shared/transform");

const mockTransform = jest.mocked(sharedTransformModule.transform);

describe("transform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should delegate to the shared occupation group transform", () => {
    const givenGroup = getIOccupationGroupMockData();
    const givenBasePath = "https://resources.example.com";
    const givenResponse = { id: "group-1" };

    mockTransform.mockReturnValue(givenResponse as never);

    const actual = transform(givenGroup, givenBasePath);

    expect(mockTransform).toHaveBeenCalledWith(givenGroup, givenBasePath);
    expect(actual).toBe(givenResponse);
  });
});
