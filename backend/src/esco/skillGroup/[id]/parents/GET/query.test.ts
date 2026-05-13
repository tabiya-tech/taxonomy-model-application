import { getMockStringId } from "_test_utilities/mockMongoId";
import { getSkillGroupParentsPathParameters } from "./query";

describe("skillGroup parents GET query helpers", () => {
  test("getSkillGroupParentsPathParameters parses the parents route", () => {
    const modelId = getMockStringId(1);
    const id = getMockStringId(2);

    expect(getSkillGroupParentsPathParameters(`/models/${modelId}/skillGroups/${id}/parents`)).toEqual({
      modelId,
      id,
    });
  });
});
