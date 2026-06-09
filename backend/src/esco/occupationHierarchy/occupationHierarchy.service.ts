import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IOccupation } from "esco/occupations/_shared/occupation.types";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import {
  IOccupationHierarchyService,
  ParentForOccupationValidationErrorCode,
  OccupationParentValidationError,
} from "esco/occupationHierarchy/occupationHierarchy.service.types";
import { ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { getModelName, MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationHierarchyParentType } from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  isNewOccupationHierarchyPairSpecValid,
  isParentChildCodeConsistent,
} from "esco/occupationHierarchy/occupationHierarchyValidation";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";
import { populateEmptyRequiresSkills } from "esco/occupationToSkillRelation/populateFunctions";

export class OccupationHierarchyService implements IOccupationHierarchyService {
  private readonly occupationRepository: IOccupationRepository;
  private readonly occupationGroupRepository: IOccupationGroupRepository;
  private readonly occupationHierarchyRepository: IOccupationHierarchyRepository;

  constructor(
    occupationRepository: IOccupationRepository,
    occupationGroupRepository: IOccupationGroupRepository,
    occupationHierarchyRepository: IOccupationHierarchyRepository
  ) {
    this.occupationRepository = occupationRepository;
    this.occupationGroupRepository = occupationGroupRepository;
    this.occupationHierarchyRepository = occupationHierarchyRepository;
  }

  async setParent(
    modelId: string,
    childId: string,
    parentId: string,
    parentType: string
  ): Promise<IOccupation | IOccupationGroup> {
    // 1. Fetch the child occupation
    const child = await this.occupationRepository.Model.findOne({
      _id: childId,
      modelId: modelId,
    }).exec();

    if (!child) {
      throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND);
    }

    // 2. Fetch the parent entity
    let parentDoc = null;
    if (parentType === ObjectTypes.ISCOGroup || parentType === ObjectTypes.LocalGroup) {
      parentDoc = await this.occupationGroupRepository.Model.findOne({
        _id: parentId,
        modelId: modelId,
      }).exec();
    } else if (parentType === ObjectTypes.ESCOOccupation || parentType === ObjectTypes.LocalOccupation) {
      parentDoc = await this.occupationRepository.Model.findOne({
        _id: parentId,
        modelId: modelId,
      }).exec();
    }

    if (!parentDoc) {
      throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND);
    }

    const parentObjectType =
      "occupationType" in parentDoc
        ? (parentDoc as unknown as IOccupation).occupationType
        : (parentDoc as unknown as IOccupationGroup).groupType;

    // 3. Validate parent-child type compatibility & code consistency
    const existingIds = new Map<string, ObjectTypes[]>();
    existingIds.set(child._id.toString(), [child.occupationType]);
    existingIds.set(parentDoc._id.toString(), [parentObjectType]);

    const idToCode = new Map<string, { type: ObjectTypes; code: string }[]>();
    idToCode.set(child._id.toString(), [{ type: child.occupationType, code: child.code }]);
    idToCode.set(parentDoc._id.toString(), [{ type: parentObjectType, code: parentDoc.code }]);

    const isPairValid = isNewOccupationHierarchyPairSpecValid(
      {
        parentId: parentId,
        parentType: parentType as unknown as OccupationHierarchyParentType,
        childId: childId,
        childType: child.occupationType,
      },
      existingIds
    );
    if (!isPairValid) {
      throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.INVALID_PARENT_TYPE);
    }

    const isCodeValid = isParentChildCodeConsistent(
      parentType as unknown as ObjectTypes,
      parentId,
      child.occupationType,
      childId,
      idToCode
    );
    if (!isCodeValid) {
      throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT);
    }

    // 4. Update/insert the hierarchy pair
    try {
      const parentDocModel = getModelName(parentType as unknown as ObjectTypes);
      const childDocModel = MongooseModelName.Occupation;

      const HierarchyModel = this.occupationHierarchyRepository.hierarchyModel;
      await HierarchyModel.findOneAndUpdate(
        {
          modelId: new mongoose.Types.ObjectId(modelId),
          childId: new mongoose.Types.ObjectId(childId),
          childType: child.occupationType,
        },
        {
          parentId: new mongoose.Types.ObjectId(parentId),
          parentType: parentType as unknown as OccupationHierarchyParentType,
          parentDocModel: parentDocModel,
          childDocModel: childDocModel,
        },
        { upsert: true, new: true }
      ).exec();

      populateEmptyOccupationHierarchy(parentDoc);
      if (parentType === ObjectTypes.ESCOOccupation || parentType === ObjectTypes.LocalOccupation) {
        populateEmptyRequiresSkills(parentDoc);
      }

      return parentDoc.toObject() as IOccupation | IOccupationGroup;
    } catch (error: unknown) {
      throw new OccupationParentValidationError(
        ParentForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_PARENT
      );
    }
  }
}
