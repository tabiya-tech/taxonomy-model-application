import { getMockStringId } from "_test_utilities/mockMongoId";
import { getSkillGroupDetailPathParameters } from "./query";

describe("skillGroup detail GET query helpers", () => {
  test("getSkillGroupDetailPathParameters parses the detail route", () => {
    const modelId = getMockStringId(1);
    const id = getMockStringId(2);

    expect(getSkillGroupDetailPathParameters(`/models/${modelId}/skillGroups/${id}`)).toEqual({
      modelId,
      id,
    });
  });
});
