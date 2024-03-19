import { transform } from "modelInfo/transform";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { IModelInfo, IModelInfoReference } from "modelInfo/modelInfo.types";
import { Routes } from "routes.constant";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";

describe("test the transformation of the IIModelInfo -> IModelInfoResponse", () => {
  test("should transform the IModelInfo to IModelInfoResponse", () => {
    // GIVEN a random IModelInfo
    const givenObject: IModelInfo = getIModelInfoMockData();
    //  AND some base path
    const givenBasePath = "https://some/root/path";
    // AND some uuidHistoryDetails
    const givenUuidHistoryDetails: IModelInfoReference[] = [
      {
        id: getMockStringId(1),
        UUID: randomUUID(),
        name: "foo",
        version: "",
        localeShortCode: "NA",
      },
    ];

    // WHEN the transformation function is called
    const actual: ModelInfoAPISpecs.Types.POST.Response.Payload = transform(
      givenObject,
      givenBasePath,
      givenUuidHistoryDetails
    );

    // THEN expect the transformation function to return a IModelInfoResponse
    // that contains the input from the IModelInfo
    expect(actual).toEqual({
      ...givenObject,
      // AND no UUIDHistory
      UUIDHistory: undefined,
      // AND the modelHistory as an array of IModelInfoReference
      modelHistory: givenUuidHistoryDetails,
      // AND the exportProcessState as an empty array
      exportProcessState: givenObject.exportProcessState.map((exportProcessState) => ({
        ...exportProcessState,
        timestamp: exportProcessState.timestamp.toISOString(),
        createdAt: exportProcessState.createdAt.toISOString(),
        updatedAt: exportProcessState.updatedAt.toISOString(),
      })),
      // AND the importProcessState as an object with the same properties
      importProcessState: {
        ...givenObject.importProcessState,
        createdAt: givenObject.importProcessState.createdAt!.toISOString(),
        updatedAt: givenObject.importProcessState.updatedAt!.toISOString(),
      },
      // AND the path and tabiya path as based on the given base path
      path: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.id}`,
      tabiyaPath: `${givenBasePath}${Routes.MODELS_ROUTE}/${givenObject.UUID}`,
      // AND the createdAt and updatedAt as string representation of date
      createdAt: givenObject.createdAt.toISOString(),
      updatedAt: givenObject.updatedAt.toISOString(),
    });
  });
});
