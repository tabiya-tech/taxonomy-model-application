import { ObjectTypes } from "esco/common/objectTypes";
import { isRelationPairValid } from "esco/common/relationValidation";
import { toRelationshipPairSpec } from "esco/common/hierarchy";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";
import { OccupationType } from "esco/occupation/occupation.types";

export function isNewOccupationHierarchyPairSpecValid(
  spec: INewOccupationHierarchyPairSpec,
  existingIds: Map<string, ObjectTypes>,
  occupationTypes: Map<string, OccupationType>
): boolean {
  // filter out all hierarchy specs where the parent is a local occupation and the child is an esco or a localized occupation
  if (spec.parentType === ObjectTypes.Occupation && spec.childType === ObjectTypes.Occupation) {
    const parentOccupationType = occupationTypes.get(spec.parentId.toString());
    if (parentOccupationType === OccupationType.LOCAL) {
      const childOccupationType = occupationTypes.get(spec.childId.toString());
      if (childOccupationType === OccupationType.ESCO || childOccupationType === OccupationType.LOCALIZED) {
        return false;
      }
    }
  }

  const relationshipSpec = toRelationshipPairSpec(spec);
  const validPairsForOccupationHierarchy = [
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.ISCOGroup },
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.Occupation },
    { firstPartnerType: ObjectTypes.Occupation, secondPartnerType: ObjectTypes.Occupation },
  ];
  return isRelationPairValid(relationshipSpec, existingIds, validPairsForOccupationHierarchy);
}
