import { ObjectTypes } from "./objectTypes";

/**
 * Represents a standardized relationship specification for easier validation.
 */

export interface IRelationshipSpec {
  firstPartnerType: ObjectTypes;
  firstPartnerId: string;
  secondPartnerType: ObjectTypes;
  secondPartnerId: string;
}

/**
 * Validates if the given spec represents a valid relationship based on existing IDs and valid pair types.
 *
 * @param spec - The relation pair spec or skill to skill relationship spec to validate.
 * @param existingIds - A map of existing IDs and their corresponding types.
 * @param validPairTypes - An array of valid first and second partner type combinations.
 * @returns A boolean indicating if the spec represents a valid relationship.
 */

export function isRelationPairValid(
  spec: IRelationshipSpec,
  existingIds: Map<string, ObjectTypes[]>,
  validPairTypes: { firstPartnerType: ObjectTypes; secondPartnerType: ObjectTypes }[]
): boolean {
  // Return false if first and second partner IDs are the same (self-referencing)
  if (spec.firstPartnerId === spec.secondPartnerId) {
    return false;
  }

  // Return false if partner types are not in the list of valid pair types
  const isIncluded = validPairTypes.some(
    (pairType) =>
      pairType.firstPartnerType === spec.firstPartnerType && pairType.secondPartnerType === spec.secondPartnerType
  );
  if (!isIncluded) return false;

  // Verify that the first partner ID exists and has the expected type
  // Return false if first partner ID doesn't exist
  const existingFirstPartnerType = existingIds.get(spec.firstPartnerId);
  if (!existingFirstPartnerType) return false;
  // or if its type doesn't match
  if (!existingFirstPartnerType.includes(spec.firstPartnerType)) return false;

  // Return false if second partner ID doesn't exist
  const existingSecondPartnerType = existingIds.get(spec.secondPartnerId);
  if (!existingSecondPartnerType) return false;
  // or if its type doesn't match
  if (!existingSecondPartnerType.includes(spec.secondPartnerType)) return false;

  //  If everything passes return true
  return true;
}
