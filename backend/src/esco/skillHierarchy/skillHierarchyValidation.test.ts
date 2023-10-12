import { ObjectTypes } from "esco/common/objectTypes";
import { INewSkillHierarchyPairSpec } from "./skillHierarchy.types";
import * as relationValidationModule from "esco/common/relationValidation";
import { isNewSkillHierarchyPairSpecValid } from "./skillHierarchyValidation";

describe("SkillHierarchyValidation", () => {
  // for each valid pair type
  test.each([true, false])("should return %s for skill hierarchy pair", (givenResult) => {
    // GIVEN some pair
    const givenPair: INewSkillHierarchyPairSpec = {
      parentId: "foo",
      parentType: ObjectTypes.Skill,
      childId: "bar",
      childType: ObjectTypes.SkillGroup,
    };
    // AND some existingIds
    const givenExistingIds: Map<string, ObjectTypes> = new Map<string, ObjectTypes>();
    // AND the isRelationPairValid returns the given result
    jest.spyOn(relationValidationModule, "isRelationPairValid").mockImplementation(() => givenResult);

    // WHEN the isNewSkillHierarchyPairSpecValid is called with the pair and existingIds
    const actualResult = isNewSkillHierarchyPairSpecValid(givenPair, givenExistingIds);

    // THEN it should call isRelationPairValid with the correct arguments
    expect(relationValidationModule.isRelationPairValid).toHaveBeenCalledWith(
      {
        firstPartnerId: givenPair.parentId,
        firstPartnerType: givenPair.parentType,
        secondPartnerId: givenPair.childId,
        secondPartnerType: givenPair.childType,
      },
      givenExistingIds,
      [
        { firstPartnerType: ObjectTypes.SkillGroup, secondPartnerType: ObjectTypes.SkillGroup },
        { firstPartnerType: ObjectTypes.SkillGroup, secondPartnerType: ObjectTypes.Skill },
        { firstPartnerType: ObjectTypes.Skill, secondPartnerType: ObjectTypes.Skill },
      ]
    );
    // AND it should return the result of isRelationPairValid
    expect(actualResult).toBe(givenResult);
  });
});
