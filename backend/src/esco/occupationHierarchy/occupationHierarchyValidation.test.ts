import { ObjectTypes } from "esco/common/objectTypes";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";
import { isNewOccupationHierarchyPairSpecValid } from "./occupationHierarchyValidation";
import * as relationValidationModule from "esco/common/relationValidation";

describe("OccupationHierarchyValidation", () => {
  // for each valid pair type
  test.each([true, false])("should return %s for occupation hierarchy pair", (givenResult) => {
    // GIVEN some pair
    const givenPair: INewOccupationHierarchyPairSpec = {
      parentId: "foo",
      parentType: ObjectTypes.ISCOGroup,
      childId: "bar",
      childType: ObjectTypes.Occupation,
    } as unknown as INewOccupationHierarchyPairSpec;
    // AND some existingIds
    const givenExistingIds: Map<string, ObjectTypes> = new Map<string, ObjectTypes>();
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
        { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.Occupation },
        { firstPartnerType: ObjectTypes.Occupation, secondPartnerType: ObjectTypes.Occupation },
      ]
    );
    // AND it should return the result of isRelationPairValid
    expect(actualResult).toBe(givenResult);
  });
});
