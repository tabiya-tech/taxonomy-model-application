import { ObjectTypes } from "esco/common/objectTypes";
import { isRelationPairValid } from "esco/common/relationValidation";
import { toRelationshipPairSpec } from "esco/common/hierarchy";
import { INewOccupationHierarchyPairSpec } from "./occupationHierarchy.types";


/**
 * Check if the given occupation hierarchy pair spec is valid in relation to the existing IDs and their types.
 * Checks that the pair refers to objects that exist in the database and that the types
 * of the objects are such that they can be related in the hierarchy.
 * For more information about the rules concerning occupation hierarchy relationships, see backend/taxonomy-hierarchy.md
 * @param spec - The occupation hierarchy pair spec to validate.
 * @param existingIds - A map of existing IDs and their corresponding types.
 * @returns A boolean indicating if the spec is valid.
 * */
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


/**
 * Check if the parent-child code relationship is valid in relation to the codes of the parent and child objects.
 * For more information about the rules concerning occupation hierarchy codes, see backend/taxonomy-hierarchy.md
 * @param parentType - The type of the parent object.
 * @param parentId - The ID of the parent object.
 * @param childType - The type of the child object.
 * @param childId - The ID of the child object.
 * @param idToCode - A map of object IDs and their corresponding codes.
 * @returns A boolean indicating if the parent-child code relationship is valid.
 * */
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
