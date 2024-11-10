import { ObjectTypes } from "esco/common/objectTypes";
import { isRelationPairValid } from "esco/common/relationValidation";
import { toRelationshipPairSpec } from "esco/common/hierarchy";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";

export function isNewOccupationHierarchyPairSpecValid(
  spec: INewOccupationHierarchyPairSpec,
  existingIds: Map<string, ObjectTypes[]>
): boolean {
  const relationshipSpec = toRelationshipPairSpec(spec);
  const validPairsForOccupationHierarchy = [
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.ISCOGroup },
    { firstPartnerType: ObjectTypes.LocalGroup, secondPartnerType: ObjectTypes.LocalGroup },
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.ESCOOccupation },
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.LocalOccupation },
    { firstPartnerType: ObjectTypes.LocalGroup, secondPartnerType: ObjectTypes.LocalOccupation },
    { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.ESCOOccupation },
    { firstPartnerType: ObjectTypes.ESCOOccupation, secondPartnerType: ObjectTypes.LocalOccupation },
    { firstPartnerType: ObjectTypes.LocalOccupation, secondPartnerType: ObjectTypes.LocalOccupation },
  ];
  return isRelationPairValid(relationshipSpec, existingIds, validPairsForOccupationHierarchy);
}
