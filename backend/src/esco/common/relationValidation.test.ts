import { IRelationshipSpec, isRelationPairValid, ValidPairTypes } from "./relationValidation";
import { ObjectTypes } from "./objectTypes";

function getValidArguments() {
  // GIVEN some valid type pairs
  const givenValidTypePairs: ValidPairTypes = [
    { firstPartnerType: ObjectTypes.Skill, secondPartnerType: ObjectTypes.Skill },
    { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.OccupationGroup },
  ];
  // AND a Valid pair
  const givenPair = {
    firstPartnerId: "foo",
    firstPartnerType: givenValidTypePairs[0].firstPartnerType,
    secondPartnerId: "bar",
    secondPartnerType: givenValidTypePairs[0].secondPartnerType,
  } as IRelationshipSpec;

  // AND some existingIds than contains the first and second partner ids
  const givenExistingIds = new Map<string, ObjectTypes[]>();
  givenExistingIds.set(givenPair.firstPartnerId, [givenPair.firstPartnerType]);
  givenExistingIds.set(givenPair.secondPartnerId, [givenPair.secondPartnerType]);
  return { givenPair, givenExistingIds, givenValidTypePairs };
}

describe("isRelationPairValid", () => {
  it("should return true for a valid pair", () => {
    // GIVEN some valid type pairs
    // AND a Valid pair
    // AND some existingIds than contains the first and second partner ids
    const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();

    // WHEN isRelationPairValid is called with the pair, existingIds and valid type pairs
    const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

    // THEN it should return true
    expect(actualResult).toBe(true);
  });

  it("should return true for a valid pair with same object ids but different types", () => {
    // GIVEN some type pairs
    const givenValidTypePairs: ValidPairTypes = [
      {
        firstPartnerType: ObjectTypes.Skill,
        secondPartnerType: ObjectTypes.OccupationGroup,
      },
    ];
    // AND a Valid pair where the first and second partner ids are the same
    const givenObjectId = "foo";
    const givenPair = {
      firstPartnerType: ObjectTypes.Skill,
      firstPartnerId: givenObjectId,
      secondPartnerType: ObjectTypes.OccupationGroup,
      secondPartnerId: givenObjectId,
    };
    // AND some existingIds than contains the first and second partner ids
    const givenExistingIds = new Map<string, ObjectTypes[]>();
    givenExistingIds.set(givenObjectId, [ObjectTypes.Skill, ObjectTypes.OccupationGroup]);

    // WHEN isRelationPairValid is called with the pair, existingIds and valid type pairs
    const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

    // THEN it should return true
    expect(actualResult).toBe(true);
  });

  it("should return true when existingIds contain multiple types", () => {
    // GIVEN some valid type pairs
    // AND a Valid pair
    // AND some existingIds than contains the first and second partner
    const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();
    // AND there are multiple types for the first and second partner ids
    givenExistingIds.get(givenPair.firstPartnerId)?.push(ObjectTypes.ESCOOccupation);
    givenExistingIds.get(givenPair.secondPartnerId)?.push(ObjectTypes.ESCOOccupation);

    // WHEN isRelationPairValid is called with the pair, existingIds and valid type pairs
    const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

    // THEN it should return true
    expect(actualResult).toBe(true);
  });

  describe("should fail same partner ids", () => {
    it("should return false when firstPartnerId is the same as the secondPartnerId", () => {
      // GIVEN a pair where the firstPartnerType is not in the valid type pairs
      // AND all other arguments are valid
      const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();
      givenPair.firstPartnerId = givenPair.secondPartnerId;

      // WHEN isRelationPairValid is called with an invalid pair, existingIds and the valid pairs
      const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

      // THEN it should return false
      expect(actualResult).toBe(false);
    });
  });

  describe("should fail invalid types", () => {
    it("should return false when firstPartnerType is not in the valid type pairs", () => {
      // GIVEN a pair where the firstPartnerType is not in the valid type pairs
      // AND all other arguments are valid
      const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();

      const givenInvalidTypePairs = givenValidTypePairs;
      givenInvalidTypePairs[0].firstPartnerType = ObjectTypes.OccupationGroup;

      // WHEN isRelationPairValid is called with an invalid pair, existingIds and the valid pairs
      const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenInvalidTypePairs);

      // THEN it should return true
      expect(actualResult).toBe(false);
    });

    it("should return false when secondPartnerType is not in the valid type pairs", () => {
      // GIVEN a pair where the firstPartnerType is not in the valid type pairs
      // AND all other arguments are valid
      const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();

      const givenInvalidTypePairs = givenValidTypePairs;
      givenInvalidTypePairs[0].secondPartnerType = ObjectTypes.OccupationGroup;

      // WHEN isRelationPairValid is called with an invalid pair, existingIds and the valid pairs
      const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenInvalidTypePairs);

      // THEN it should return true
      expect(actualResult).toBe(false);
    });
  });

  describe("should fail invalid ids", () => {
    it("should return false when firstPartnerId is not found in the existing ids", () => {
      // GIVEN the firstPartnerId is not found in the existing ids
      // AND all other arguments are valid
      const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();
      givenExistingIds.delete(givenPair.firstPartnerId);

      // WHEN isRelationPairValid is called with the pair, existingIds and valid type pairs
      const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

      // THEN it should return false
      expect(actualResult).toBe(false);
    });

    it("should return false when secondPartnerId is not found in the existing ids", () => {
      // GIVEN the firstPartnerId is not found in the existing ids
      // AND all other arguments are valid
      const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();
      givenExistingIds.delete(givenPair.secondPartnerId);

      // WHEN isRelationPairValid is called with the pair, existingIds and valid type pairs
      const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

      // THEN it should return false
      expect(actualResult).toBe(false);
    });
  });

  describe("should fail inconsistent type with existing ids", () => {
    it("should return false when firstPartner type does not match the type found in the existing ids", () => {
      // GIVEN the firstPartner type does not match the type found in the existing ids
      // AND all other arguments are valid
      const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();
      givenExistingIds.set(givenPair.firstPartnerId, [ObjectTypes.OccupationGroup]);

      // WHEN isRelationPairValid is called with the pair, existingIds and valid type pairs
      const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

      // THEN it should return false
      expect(actualResult).toBe(false);
    });

    it("should return false when secondPartner type does not match the type found in the existing ids", () => {
      // GIVEN the secondPartner type does not match the type found in the existing ids
      // AND all other arguments are valid
      const { givenPair, givenExistingIds, givenValidTypePairs } = getValidArguments();
      givenExistingIds.set(givenPair.secondPartnerId, [ObjectTypes.SkillGroup]);

      // WHEN isRelationPairValid is called with the pair, existingIds and valid type pairs
      const actualResult = isRelationPairValid(givenPair, givenExistingIds, givenValidTypePairs);

      // THEN it should return false
      expect(actualResult).toBe(false);
    });
  });
});
