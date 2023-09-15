import {transform} from "./transform";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import {getIModelInfoMockData} from "./testDataHelper";
import {IModelInfo} from "./modelInfo.types";


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
    expect(actual).toMatchObject({
      ...givenObject,
      // AND the path and tabiya path as based on the given base path
      path: `${givenBasePath}/${givenObject.id}`,
      tabiyaPath: `${givenBasePath}/${givenObject.UUID}`,
      // AND the createdAt and updatedAt as string representation of date
      createdAt: givenObject.createdAt.toISOString(),
      updatedAt: givenObject.updatedAt.toISOString()
    });
  });
});