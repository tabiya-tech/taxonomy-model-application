import { ObjectTypes } from "./objectTypes";
import { IRelationshipSpec } from "./relationValidation";

export interface IHierarchyPairSpec {
  parentType: ObjectTypes;
  parentId: string;

  childId: string;
  childType: ObjectTypes;
}

export function toRelationshipPairSpec(spec: IHierarchyPairSpec): IRelationshipSpec {
  return {
    firstPartnerId: spec.parentId,
    firstPartnerType: spec.parentType,
    secondPartnerId: spec.childId,
    secondPartnerType: spec.childType,
  };
}
