import { ObjectTypes, OccupationType, RelationType } from "esco/common/objectTypes";
import * as relationValidationModule from "esco/common/relationValidation";
import { INewOccupationToSkillPairSpec } from "./occupationToSkillRelation.types";
import { isNewOccupationToSkillRelationPairSpecValid } from "./occupationToSkillRelationValidation";

describe("OccupationToSkillsRelationValidation", () => {
  // for each valid pair type
  test.each([true, false])("should return %s for skill relation pair", (givenResult) => {
    // GIVEN some pair
    const givenPair: INewOccupationToSkillPairSpec = {
      requiringOccupationId: "foo",
      requiredSkillId: "bar",
      relationType: RelationType.ESSENTIAL,
      requiringOccupationType: OccupationType.ESCO,
    };
    // AND some existingIds
    const givenExistingIds: Map<string, [ObjectTypes]> = new Map<string, [ObjectTypes]>();
    // AND the isRelationPairValid returns the given result
    jest.spyOn(relationValidationModule, "isRelationPairValid").mockImplementation(() => givenResult);

    // WHEN the isNewOccupationToSkillRelationPaiSpecValid is called with the pair and existingIds
    const actualResult = isNewOccupationToSkillRelationPairSpecValid(givenPair, givenExistingIds);

    // THEN it should call isRelationPairValid with the correct arguments
    expect(relationValidationModule.isRelationPairValid).toHaveBeenCalledWith(
      {
        firstPartnerId: givenPair.requiringOccupationId,
        firstPartnerType: ObjectTypes.Occupation,
        secondPartnerId: givenPair.requiredSkillId,
        secondPartnerType: ObjectTypes.Skill,
      },
      givenExistingIds,
      [{ firstPartnerType: ObjectTypes.Occupation, secondPartnerType: ObjectTypes.Skill }]
    );
    // AND it should return the result of isRelationPairValid
    expect(actualResult).toBe(givenResult);
  });
});
