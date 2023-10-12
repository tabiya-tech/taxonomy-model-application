import { ObjectTypes } from "esco/common/objectTypes";
import { isRelationPairValid } from "esco/common/relationValidation";
import { toRelationshipPairSpec } from "esco/common/hierarchy";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";

export function isNewOccupationHierarchyPairSpecValid(
  spec: INewOccupationHierarchyPairSpec,
  existingIds: Map<string, ObjectTypes>
): boolean {
  const relationshipSpec = toRelationshipPairSpec(spec);
  const validPairsForOccupationHierarchy = [
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.ISCOGroup },
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.Occupation },
    { firstPartnerType: ObjectTypes.Occupation, secondPartnerType: ObjectTypes.Occupation },
  ];
  return isRelationPairValid(relationshipSpec, existingIds, validPairsForOccupationHierarchy);
}
