import "_test_utilities/consoleMock";

import { getISkillGroupMockData } from "../_shared/testDataHelper";
import * as sharedTransformModule from "esco/skillGroup/_shared/transform";
import { transform } from "./response";

jest.mock("esco/skillGroup/_shared/transform");

const mockTransform = jest.mocked(sharedTransformModule.transform);

describe("transform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should delegate to the shared skill group transform", () => {
    const givenGroup = getISkillGroupMockData();
    const givenBasePath = "https://resources.example.com";
    const givenResponse = { id: "group-1" };

    mockTransform.mockReturnValue(givenResponse as never);

    const actual = transform(givenGroup, givenBasePath);

    expect(mockTransform).toHaveBeenCalledWith(givenGroup, givenBasePath);
    expect(actual).toBe(givenResponse);
  });
});
