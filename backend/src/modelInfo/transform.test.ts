import { transform } from "modelInfo/transform";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { Routes } from "routes.constant";

describe("test the transformation of the IIModelInfo -> IModelInfoResponse", () => {
  test("should transform the IModelInfo to IModelInfoResponse", () => {
    // GIVEN a random IModelInfo
    const givenObject: IModelInfo = getIModelInfoMockData();
    //  AND some base path
    const givenBasePath = "https://some/root/path";

    // WHEN the transformation function is called
    const actual: ModelInfoAPISpecs.Types.POST.Response.Payload = transform(givenObject, givenBasePath);

    // THEN expect the transformation function to return a IModelInfoResponse
    // that contains the input from the IModelInfo
    expect(actual).toEqual({
      ...givenObject,
      // AND the exportProcessState as an empty array
      exportProcessState: givenObject.exportProcessState.map((exportProcessState) => ({
        ...exportProcessState,
        timestamp: exportProcessState.timestamp.toISOString(),
      })),
      // AND the path and tabiya path as based on the given base path
      path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.id}`,
      tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.UUID}`,
      // AND the createdAt and updatedAt as string representation of date
      createdAt: givenObject.createdAt.toISOString(),
      updatedAt: givenObject.updatedAt.toISOString(),
    });
  });
});
