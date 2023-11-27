// Mute chatty console logs
import "_test_utilities/consoleMock";

import LocalOccupationsToCSVTransform from "./LocalOccupationsToCSVTransform";
import * as BaseOccupationsToCSVTransformModule from "./BaseOccupationsToCSVTransform";
import { OccupationType } from "esco/common/objectTypes";

describe("LocalOccupationsDoc2csvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test("should call BaseOccupationsToCSVTransform with the correct parameters", async () => {
    // GIVEN a modelId
    const givenModelId = "foo";

    // AND BaseOccupationsToCSVTransform will return some stream
    const givenStream = { foo: "foo" };
    jest.spyOn(BaseOccupationsToCSVTransformModule, "default").mockReturnValue(givenStream as any);

    // WHEN the transformation is applied
    const actualStream = LocalOccupationsToCSVTransform(givenModelId);

    // THEN BaseOccupationsToCSVTransform should be called with the correct parameters
    expect(BaseOccupationsToCSVTransformModule.default).toHaveBeenCalledWith(givenModelId, OccupationType.LOCAL);

    // AND to return the stream that the BaseOccupationsToCSVTransform returns
    expect(actualStream).toEqual(givenStream);
  });
});
