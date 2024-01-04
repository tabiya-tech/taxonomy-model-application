import { ObjectTypes } from "esco/common/objectTypes";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";
import { isNewOccupationHierarchyPairSpecValid } from "./occupationHierarchyValidation";
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
    const givenExistingIds: Map<string, [ObjectTypes]> = new Map<string, [ObjectTypes]>();
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
        { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.ESCOOccupation },
        { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.LocalOccupation },
        { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.ESCOOccupation },
        { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.LocalOccupation },
        { firstPartnerType: ObjectTypes.LocalOccupation, secondPartnerType: ObjectTypes.LocalOccupation },
      ]
    );
    // AND it should return the result of isRelationPairValid
    expect(actualResult).toBe(givenResult);
  });
});
