import { getMockStringId } from "_test_utilities/mockMongoId";
import { getSkillGroupChildrenPathParameters } from "./query";

describe("skillGroup children GET query helpers", () => {
  test("getSkillGroupChildrenPathParameters parses the children route", () => {
    const modelId = getMockStringId(1);
    const id = getMockStringId(2);

    expect(getSkillGroupChildrenPathParameters(`/models/${modelId}/skillGroups/${id}/children`)).toEqual({
      modelId,
      id,
    });
  });
});
