import { ObjectTypes } from "esco/common/objectTypes";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";
import { isNewOccupationHierarchyPairSpecValid, isParentChildCodeConsistent } from "./occupationHierarchyValidation";
import * as relationValidationModule from "esco/common/relationValidation";

describe("OccupationHierarchyValidation", () => {
  test.each([true, false])("should return %s for occupation hierarchy pair", (givenResult) => {
    // GIVEN some pair
    const givenPair: INewOccupationHierarchyPairSpec = {
      parentId: "foo",
      parentType: ObjectTypes.ISCOGroup,
      childId: "bar",
      childType: ObjectTypes.ESCOOccupation,
    } as unknown as INewOccupationHierarchyPairSpec;

    // AND existingIds of the pair
    const givenExistingIds: Map<string, ObjectTypes[]> = new Map<string, ObjectTypes[]>();
    givenExistingIds.set(givenPair.parentId, [givenPair.parentType]);
    givenExistingIds.set(givenPair.childId, [givenPair.childType]);

    // AND the isRelationPairValid returns the given result
    jest.spyOn(relationValidationModule, "isRelationPairValid").mockImplementation(() => givenResult);

    // WHEN the isNewOccupationHierarchyPairSpecValid is called with the pair and existingIds
    const actualResult = isNewOccupationHierarchyPairSpecValid(givenPair, givenExistingIds);

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
        { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.ISCOGroup },
        { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.LocalGroup },
        { firstPartnerType: ObjectTypes.LocalGroup, secondPartnerType: ObjectTypes.LocalGroup },
        { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.ESCOOccupation },
        { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.LocalOccupation },
        { firstPartnerType: ObjectTypes.LocalGroup, secondPartnerType: ObjectTypes.LocalOccupation },
        { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.ESCOOccupation },
        { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.LocalOccupation },
        { firstPartnerType: ObjectTypes.LocalOccupation, secondPartnerType: ObjectTypes.LocalOccupation },
      ]
    );
    // AND it should return the result of isRelationPairValid
    expect(actualResult).toBe(givenResult);
  });
});

describe("isParentChildCodeConsistent", () => {
  const createIdToCodeMap = (
    parentId: string,
    parentCode: string,
    parentType: ObjectTypes,
    childId: string,
    childCode: string,
    childType: ObjectTypes
  ) => {
    const map = new Map<string, { type: ObjectTypes; code: string }[]>();
    map.set(parentId, [{ type: parentType, code: parentCode }]);
    map.set(childId, [{ type: childType, code: childCode }]);
    return map;
  };

  describe("ISCO Group parent with Local Group child", () => {
    test.each([
      // parentCode, childCode, expectedResult
      [true, "123", "123a"],
      [true, "123", "123A"],
      [false, "123", "123abc1"],
      [false, "123", "123ABC2"],
      [false, "123", "124abc1"],
      [false, "123", "abc1"],
    ])("should return %s when parent code is %s and child code is %s", (expectedResult, parentCode, childCode) => {
      // GIVEN
      const parentId = "parent1";
      const childId = "child1";
      const idToCode = createIdToCodeMap(
        parentId,
        parentCode,
        ObjectTypes.ISCOGroup,
        childId,
        childCode,
        ObjectTypes.LocalGroup
      );

      // WHEN
      const result = isParentChildCodeConsistent(
        ObjectTypes.ISCOGroup,
        parentId,
        ObjectTypes.LocalGroup,
        childId,
        idToCode
      );

      // THEN
      expect(result).toBe(expectedResult);
    });
  });

  describe("ISCO Group parent with ISCO Group child", () => {
    test.each([
      // parentCode, childCode, expectedResult
      [true, "1", "12"],
      [true, "1234", "12345"],
      [false, "1", "123"],
      [false, "1", "2"],
      [false, "123", "45"],
    ])("should return %s when parent code is %s and child code is %s", (expectedResult, parentCode, childCode) => {
      // GIVEN
      const parentId = "parent1";
      const childId = "child1";
      const idToCode = createIdToCodeMap(
        parentId,
        parentCode,
        ObjectTypes.ISCOGroup,
        childId,
        childCode,
        ObjectTypes.ISCOGroup
      );

      // WHEN
      const result = isParentChildCodeConsistent(
        ObjectTypes.ISCOGroup,
        parentId,
        ObjectTypes.ISCOGroup,
        childId,
        idToCode
      );

      // THEN
      expect(result).toBe(expectedResult);
    });
  });

  describe("Local Group parent with Local Group child", () => {
    test.each([
      // parentCode, childCode, expectedResult
      [true, "abc", "abcd"],
      [true, "abc", "abcD"],
      [false, "abc", "abcde"],
      [false, "abc", "abcdef1234"],
      [false, "abc", "def1"],
      [false, "abc", "123abc"],
    ])("should return %s when parent code is %s and child code is %s", (expectedResult, parentCode, childCode) => {
      // GIVEN
      const parentId = "parent1";
      const childId = "child1";
      const idToCode = createIdToCodeMap(
        parentId,
        parentCode,
        ObjectTypes.LocalGroup,
        childId,
        childCode,
        ObjectTypes.LocalGroup
      );

      // WHEN
      const result = isParentChildCodeConsistent(
        ObjectTypes.LocalGroup,
        parentId,
        ObjectTypes.LocalGroup,
        childId,
        idToCode
      );

      // THEN
      expect(result).toBe(expectedResult);
    });
  });

  describe("ISCO/Local Group parent with ESCO Occupation child", () => {
    test.each([
      [true, "1234", "1234.1"],
      [true, "1234", "1234.56"],
      [true, "abcde", "abcde.1"],
      [false, "1234", "1234_1"],
      [false, "1234", "123.1"],
      [false, "abcde", "abcde_1"],
    ])("should return %s when parent code is %s and child code is %s", (expectedResult, parentCode, childCode) => {
      // GIVEN
      const parentId = "parent1";
      const childId = "child1";
      const idToCode = createIdToCodeMap(
        parentId,
        parentCode,
        ObjectTypes.ISCOGroup,
        childId,
        childCode,
        ObjectTypes.ESCOOccupation
      );

      // WHEN
      const result = isParentChildCodeConsistent(
        ObjectTypes.ISCOGroup,
        parentId,
        ObjectTypes.ESCOOccupation,
        childId,
        idToCode
      );

      // THEN
      expect(result).toBe(expectedResult);
    });
  });

  describe("ISCO/Local Group parent with Local Occupation child", () => {
    test.each([
      // parentCode, childCode, expectedResult
      [true, "1234", "1234_1"],
      [true, "1234", "1234_1abc"],
      [true, "abcde", "abcde_123abc"],
      [false, "1234", "1234.1"],
      [false, "1234", "123_1"],
      [false, "abcde", "abcde.1"],
    ])("should return %s when parent code is %s and child code is %s", (expectedResult, parentCode, childCode) => {
      // GIVEN
      const parentId = "parent1";
      const childId = "child1";
      const idToCode = createIdToCodeMap(
        parentId,
        parentCode,
        ObjectTypes.ISCOGroup,
        childId,
        childCode,
        ObjectTypes.LocalOccupation
      );

      // WHEN
      const result = isParentChildCodeConsistent(
        ObjectTypes.ISCOGroup,
        parentId,
        ObjectTypes.LocalOccupation,
        childId,
        idToCode
      );

      // THEN
      expect(result).toBe(expectedResult);
    });
  });

  describe("Unhandled type combinations", () => {
    test("should return true for unhandled parent-child type combinations", () => {
      // GIVEN
      const parentId = "parent1";
      const childId = "child1";
      const idToCode = createIdToCodeMap(
        parentId,
        "anyCode",
        ObjectTypes.ESCOOccupation, // Parent type that isn't handled in specific cases
        childId,
        "anyCode",
        ObjectTypes.ISCOGroup // Child type combination that isn't handled
      );

      // WHEN
      const result = isParentChildCodeConsistent(
        ObjectTypes.ESCOOccupation,
        parentId,
        ObjectTypes.ISCOGroup,
        childId,
        idToCode
      );

      // THEN
      expect(result).toBe(true);
    });
  });
});
