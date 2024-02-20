import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import * as relationValidationModule from "esco/common/relationValidation";
import { isNewSkillToSkillRelationPairSpecValid } from "./skillToSkillRelationValidation";
import { INewSkillToSkillPairSpec } from "./skillToSkillRelation.types";

describe("SkillToSkillsRelationValidation", () => {
  // for each valid pair type
  test.each([true, false])("should return %s for skill relation pair", (givenResult) => {
    // GIVEN some pair
    const givenPair: INewSkillToSkillPairSpec = {
      requiredSkillId: "foo",
      requiringSkillId: "bar",
      relationType: RelationType.ESSENTIAL,
    };
    // AND some existingIds
    const givenExistingIds: Map<string, ObjectTypes[]> = new Map<string, ObjectTypes[]>();
    // AND the isRelationPairValid returns the given result
    jest.spyOn(relationValidationModule, "isRelationPairValid").mockImplementation(() => givenResult);

    // WHEN the isNewSkillToSkillRelationPaiSpecValid is called with the pair and existingIds
    const actualResult = isNewSkillToSkillRelationPairSpecValid(givenPair, givenExistingIds);

    // THEN it should call isRelationPairValid with the correct arguments
    expect(relationValidationModule.isRelationPairValid).toHaveBeenCalledWith(
      {
        firstPartnerId: givenPair.requiringSkillId,
        firstPartnerType: ObjectTypes.Skill,
        secondPartnerId: givenPair.requiredSkillId,
        secondPartnerType: ObjectTypes.Skill,
      },
      givenExistingIds,
      [{ firstPartnerType: ObjectTypes.Skill, secondPartnerType: ObjectTypes.Skill }]
    );
    // AND it should return the result of isRelationPairValid
    expect(actualResult).toBe(givenResult);
  });
});
