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
    { firstPartnerType: ObjectTypes.ISCOGroup, secondPartnerType: ObjectTypes.LocalGroup },
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
// see esco/taxonomy_hierarchy.md for an explanation of the expected code format for each entity

const REGEX_ONE_LOCALGROUP_ISCO_PARENT_HIERARCHY_INCREMENT = RegExp(/^[a-zA-Z]$/);

const REGEX_ONE_LOCALGROUP_LOCAL_PARENT_HIERARCHY_INCREMENT = RegExp(/^[a-zA-Z\d]$/);

const REGEX_ONE_ISCO_GROUP_CODE_HIERARCHY_INCREMENT = RegExp(/^\d$/);

const REGEX_ONE_ESCO_OCCUPATION_HIERARCHY_INCREMENT = RegExp(/^\.\d+$/);

const REGEX_ONE_LOCAL_OCCUPATION_HIERARCHY_INCREMENT = RegExp(/^_[a-zA-Z\d]*$/);

export function isParentChildCodeConsistent(
  parentType: ObjectTypes,
  parentId: string,
  childType: ObjectTypes,
  childId: string,
  idToCode: Map<string, { type: ObjectTypes; code: string }[]>
): boolean {
  const parentCode = idToCode.get(parentId)!.find((entry) => entry.type === parentType)!.code;
  const childCode = idToCode.get(childId)!.find((entry) => entry.type === childType)!.code;

  if (!childCode.startsWith(parentCode)) {
    return false;
  }

  if (parentType === ObjectTypes.ISCOGroup) {
    if (childType === ObjectTypes.LocalGroup) {
      return REGEX_ONE_LOCALGROUP_ISCO_PARENT_HIERARCHY_INCREMENT.test(childCode.slice(parentCode.length));
    }
    if (childType === ObjectTypes.ISCOGroup) {
      return REGEX_ONE_ISCO_GROUP_CODE_HIERARCHY_INCREMENT.test(childCode.slice(parentCode.length));
    }
  }
  if (parentType === ObjectTypes.LocalGroup && childType === ObjectTypes.LocalGroup) {
    return REGEX_ONE_LOCALGROUP_LOCAL_PARENT_HIERARCHY_INCREMENT.test(childCode.slice(parentCode.length));
  }

  if (childType === ObjectTypes.LocalOccupation) {
    return REGEX_ONE_LOCAL_OCCUPATION_HIERARCHY_INCREMENT.test(childCode.slice(parentCode.length));
  }
  if (childType === ObjectTypes.ESCOOccupation) {
    return REGEX_ONE_ESCO_OCCUPATION_HIERARCHY_INCREMENT.test(childCode.slice(parentCode.length));
  }
  return true;
}
