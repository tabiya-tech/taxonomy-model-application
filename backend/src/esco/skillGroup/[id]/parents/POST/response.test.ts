import { transformParent } from "./response";
import { getISkillGroupMockData } from "esco/skillGroup/_shared/testDataHelper";

describe("transformParent()", () => {
  test("should map a skill group into the parent API response shape", () => {
    const givenObject = getISkillGroupMockData();
    const actual = transformParent(givenObject, "https://api.example.com");

    expect(actual).toEqual(
      expect.objectContaining({
        id: givenObject.id,
        UUID: givenObject.UUID,
        UUIDHistory: givenObject.UUIDHistory,
        code: givenObject.code,
        originUri: givenObject.originUri,
        preferredLabel: givenObject.preferredLabel,
        altLabels: givenObject.altLabels,
        description: givenObject.description,
        scopeNote: givenObject.scopeNote,
        modelId: givenObject.modelId,
        parents: [],
        children: [],
        originUUID: givenObject.UUIDHistory.at(-1),
        path: `https://api.example.com/models/${givenObject.modelId}/skillGroups/${givenObject.id}`,
        tabiyaPath: `https://api.example.com/models/${givenObject.modelId}/skillGroups/${givenObject.UUID}`,
        createdAt: givenObject.createdAt.toISOString(),
        updatedAt: givenObject.updatedAt.toISOString(),
      })
    );
  });
});
