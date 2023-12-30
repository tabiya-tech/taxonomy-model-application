import { ObjectTypes, OccupationType } from "esco/common/objectTypes";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";
import { isNewOccupationHierarchyPairSpecValid } from "./occupationHierarchyValidation";
import * as relationValidationModule from "esco/common/relationValidation";

describe("OccupationHierarchyValidation", () => {
  test.each([OccupationType.ESCO, OccupationType.LOCALIZED])(
    "should return false regardless of isRelationPairValid() for a hierarchy spec when the parent is a LOCAL occupation and the child is %s",
    (givenChildOccupationType) => {
      // GIVEN a pair of occupations
      const givenPair: INewOccupationHierarchyPairSpec = {
        parentId: "foo",
        parentType: ObjectTypes.Occupation,
        childId: "bar",
        childType: ObjectTypes.Occupation,
      } as unknown as INewOccupationHierarchyPairSpec;

      // AND existingIds of the pair
      const givenExistingIds: Map<string, [ObjectTypes]> = new Map<string, [ObjectTypes]>();
      givenExistingIds.set(givenPair.parentId, [ObjectTypes.Occupation]);
      givenExistingIds.set(givenPair.childId, [ObjectTypes.Occupation]);

      // AND the  parent is LOCAL occupation
      const givenOccupationTypes: Map<string, OccupationType> = new Map<string, OccupationType>();
      givenOccupationTypes.set(givenPair.parentId, OccupationType.LOCAL);
      // AND the child is of the givenChildOccupationType
      givenOccupationTypes.set(givenPair.childId, givenChildOccupationType);

      // WHEN the isNewOccupationHierarchyPairSpecValid is called with the pair, existingIds and occupationTypes
      jest.spyOn(relationValidationModule, "isRelationPairValid");
      const actualResult = isNewOccupationHierarchyPairSpecValid(givenPair, givenExistingIds, givenOccupationTypes);

      // THEN it should return false
      expect(actualResult).toBe(false);

      // AND it should not call isRelationPairValid
      expect(relationValidationModule.isRelationPairValid).not.toHaveBeenCalled();
    }
  );

  describe.each([
    [ObjectTypes.ISCOGroup, null, ObjectTypes.ISCOGroup, null],

    [ObjectTypes.ISCOGroup, null, ObjectTypes.Occupation, OccupationType.ESCO],
    [ObjectTypes.ISCOGroup, null, ObjectTypes.Occupation, OccupationType.LOCAL],
    [ObjectTypes.ISCOGroup, null, ObjectTypes.Occupation, OccupationType.LOCALIZED],

    [ObjectTypes.Occupation, OccupationType.ESCO, ObjectTypes.ISCOGroup, null],
    [ObjectTypes.Occupation, OccupationType.LOCAL, ObjectTypes.ISCOGroup, null],
    [ObjectTypes.Occupation, OccupationType.LOCALIZED, ObjectTypes.ISCOGroup, null],

    //----- occupation to occupation
    [ObjectTypes.Occupation, OccupationType.ESCO, ObjectTypes.Occupation, OccupationType.ESCO],
    [ObjectTypes.Occupation, OccupationType.ESCO, ObjectTypes.Occupation, OccupationType.LOCAL],
    [ObjectTypes.Occupation, OccupationType.ESCO, ObjectTypes.Occupation, OccupationType.LOCALIZED],

    [ObjectTypes.Occupation, OccupationType.LOCAL, ObjectTypes.Occupation, OccupationType.LOCAL],
    // the two missing cases are covered by the first test

    [ObjectTypes.Occupation, OccupationType.LOCALIZED, ObjectTypes.Occupation, OccupationType.ESCO],
    [ObjectTypes.Occupation, OccupationType.LOCALIZED, ObjectTypes.Occupation, OccupationType.LOCAL],
    [ObjectTypes.Occupation, OccupationType.LOCALIZED, ObjectTypes.Occupation, OccupationType.LOCALIZED],
  ])(
    "for the parent %s %s and child %s %s",
    (givenParentObjectType, givenParentOccupationType, givenChildObjectType, givenChildOccupationType) => {
      // for each valid pair type

      test.each([true, false])("should return %s when calling isRelationPairValid", (givenResult) => {
        // GIVEN some pair
        const givenPair: INewOccupationHierarchyPairSpec = {
          parentId: "foo",
          parentType: givenParentOccupationType,
          childId: "bar",
          childType: givenChildOccupationType,
        } as unknown as INewOccupationHierarchyPairSpec;

        // AND existingIds of the pair
        const givenExistingIds: Map<string, [ObjectTypes]> = new Map<string, [ObjectTypes]>();
        givenExistingIds.set(givenPair.parentId, [givenPair.parentType]);
        givenExistingIds.set(givenPair.childId, [givenPair.childType]);

        // AND the occupation types is LOCAL occupation
        const givenOccupationTypes: Map<string, OccupationType> = new Map<string, OccupationType>();
        if (givenParentOccupationType !== null) {
          givenOccupationTypes.set(givenPair.parentId, givenParentOccupationType);
        }
        if (givenChildOccupationType !== null) {
          givenOccupationTypes.set(givenPair.childId, givenChildOccupationType);
        }

        // AND the isRelationPairValid returns the given result
        jest.spyOn(relationValidationModule, "isRelationPairValid").mockImplementation(() => givenResult);

        // WHEN the isNewOccupationHierarchyPairSpecValid is called with the pair and existingIds
        const actualResult = isNewOccupationHierarchyPairSpecValid(givenPair, givenExistingIds, givenOccupationTypes);

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
            { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.Occupation },
            { firstPartnerType: ObjectTypes.Occupation, secondPartnerType: ObjectTypes.Occupation },
          ]
        );
        // AND it should return the result of isRelationPairValid
        expect(actualResult).toBe(givenResult);
      });
    }
  );
});
