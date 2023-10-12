import { IHierarchyPairSpec, toRelationshipPairSpec } from "./hierarchy";
import { ObjectTypes } from "./objectTypes";

describe("toRelationshipPairSpec", () => {
  test.each([
    [
      "when given correct object",
      {
        parentId: "1",
        parentType: ObjectTypes.Skill,
        childId: "2",
        childType: ObjectTypes.SkillGroup,
      },
      {
        firstPartnerId: "1",
        firstPartnerType: ObjectTypes.Skill,
        secondPartnerId: "2",
        secondPartnerType: ObjectTypes.SkillGroup,
      },
    ],
    [
      "when passed an empty object",
      {},
      {
        firstPartnerId: undefined,
        firstPartnerType: undefined,
        secondPartnerId: undefined,
        secondPartnerType: undefined,
      },
    ],
    [
      "when fields are null",
      {
        parentId: null,
        parentType: null,
        childId: null,
        childType: null,
      },
      {
        firstPartnerId: null,
        firstPartnerType: null,
        secondPartnerId: null,
        secondPartnerType: null,
      },
    ],
  ])("should transform %s", (_description, givenInput, expectedOutput) => {
    // GIVEN a specific input value

    // WHEN the toRelationshipPairSpec function is called
    const result = toRelationshipPairSpec(givenInput as IHierarchyPairSpec);

    // THEN the result should match the expected output
    expect(result).toEqual(expectedOutput);
  });
});
