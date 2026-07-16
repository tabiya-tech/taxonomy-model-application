import mongoose, { PipelineStage } from "mongoose";
import { randomUUID } from "crypto";
import {
  INewSkillGroupSpec,
  INewSkillGroupSpecWithoutImportId,
  ISkillGroup,
  ISkillGroupChild,
  ISkillGroupDoc,
  ISkillGroupReference,
} from "../_shared/skillGroup.types";
import {
  populateSkillGroupChildrenOptions,
  populateSkillGroupParentsOptions,
} from "../_shared/populateSkillHierarchyOptions";
import { getSkillGroupDocReference, SkillGroupDocument } from "../_shared/skillGroupReference";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";
import { ISkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";
import {
  IEmbeddableEntityRepository,
  ISetEntityEmbeddingStatusSpec,
  ISetModelEntitiesEmbeddingStatusSpec,
} from "embeddings/entityEmbeddings/entityEmbedding.types";
import {
  setEntityEmbeddingStatus,
  setModelEntitiesEmbeddingStatus,
} from "embeddings/entityEmbeddings/entityEmbeddingStatus";

interface FindPaginatedFilter {
  childrenIds?: string;
  childrenType?: ObjectTypes.Skill | ObjectTypes.SkillGroup;
  root?: boolean;
}

/**
 * A single UUID from a skill group's UUIDHistory resolved to the group's reference (as it was in that model)
 * and the modelId of the model it belonged to. Both null when no group with that UUID exists. Order-preserving
 * against the input UUIDs.
 */
export interface ISkillGroupModelHistoryReference {
  UUID: string;
  modelId: string | null;
  reference: ISkillGroupReference | null;
}

export interface ISkillGroupRepository extends IEmbeddableEntityRepository {
  readonly Model: mongoose.Model<ISkillGroupDoc>;
  readonly hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>;
  create(newSkillGroupSpec: INewSkillGroupSpecWithoutImportId): Promise<ISkillGroup>;
  createMany(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]>;
  findById(id: string): Promise<ISkillGroup | null>;
  findAll(modelId: string): Readable;
  findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: FindPaginatedFilter
  ): Promise<ISkillGroup[]>;
  findParents(
    modelId: string | mongoose.Types.ObjectId,
    id: string | mongoose.Types.ObjectId,
    limit: number,
    cursor?: string
  ): Promise<ISkillGroup[]>;
  findChildren(
    modelId: string | mongoose.Types.ObjectId,
    id: string | mongoose.Types.ObjectId,
    limit: number,
    cursor?: string
  ): Promise<ISkillGroupChild[]>;

  /**
   * Finds, for each of the provided skill group UUIDs, the modelId of the skill group with that UUID.
   * Used to resolve a skill group's UUIDHistory (its own past UUIDs) to the models it appeared in.
   * Only UUIDs that match an existing skill group are returned; the result is not ordered by the input.
   *
   * @param {string[]} uuids - The skill group UUIDs to resolve.
   * @return {Promise<{ UUID: string; modelId: string }[]>} - The UUID -> modelId pairs for the matched skill groups.
   */
  /**
   * Resolves each of the provided skill group UUIDs (a group's own UUIDHistory) to the group's reference (as it
   * appeared in that model) and the modelId of the model it belonged to. Order-preserving against the input
   * UUIDs; entries whose UUID matches no group carry null modelId and null reference.
   *
   * @param {string[]} uuids - The skill group UUIDs to resolve.
   * @return {Promise<ISkillGroupModelHistoryReference[]>} - The resolved reference + modelId per input UUID.
   */
  findHistoryReferencesByUUIDs(uuids: string[]): Promise<ISkillGroupModelHistoryReference[]>;
}

export class SkillGroupRepository implements ISkillGroupRepository {
  public readonly Model: mongoose.Model<ISkillGroupDoc>;
  public readonly hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>;

  constructor(model: mongoose.Model<ISkillGroupDoc>, hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>) {
    this.Model = model;
    this.hierarchyModel = hierarchyModel;
  }

  async setEntityEmbeddingStatus(spec: ISetEntityEmbeddingStatusSpec): Promise<void> {
    return setEntityEmbeddingStatus(this.Model, spec);
  }

  async setModelEntitiesEmbeddingStatus(spec: ISetModelEntitiesEmbeddingStatusSpec): Promise<void> {
    return setModelEntitiesEmbeddingStatus(this.Model, spec);
  }

  private newSpecToModel(newSpec: INewSkillGroupSpec): mongoose.HydratedDocument<ISkillGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  private newSpecWithoutImportIdToModel(
    newSpe: INewSkillGroupSpecWithoutImportId
  ): mongoose.HydratedDocument<ISkillGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpe,
      UUID: newUUID,
      importId: null,
    });
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newSkillGroupSpec: INewSkillGroupSpecWithoutImportId): Promise<ISkillGroup> {
    //@ts-ignore
    if (newSkillGroupSpec.UUID !== undefined) {
      const err = new Error("SkillGroupRepository.create: create failed. UUID should not be provided");
      console.error(err);
      throw err;
    }

    try {
      const newSkillGroupModel = this.newSpecWithoutImportIdToModel(newSkillGroupSpec);
      await newSkillGroupModel.save();
      populateEmptySkillHierarchy(newSkillGroupModel);
      return newSkillGroupModel.toObject();
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.create: create failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async createMany(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]> {
    const newSkillGroupsDocuments: mongoose.Document<unknown, unknown, ISkillGroupDoc>[] = [];
    try {
      const newSkillGroupModels = newSkillGroupSpecs
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newSkillGroupModels, {
        ordered: false,
      });
      newSkillGroupsDocuments.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<ISkillGroupDoc>(
        e,
        "SkillGroupRepository.createMany",
        newSkillGroupSpecs.length
      );
      newSkillGroupsDocuments.push(...docs);
    }
    if (newSkillGroupSpecs.length !== newSkillGroupsDocuments.length) {
      console.warn(
        `SkillGroupRepository.createMany: ${
          newSkillGroupSpecs.length - newSkillGroupsDocuments.length
        } invalid entries were not created`
      );
    }
    return newSkillGroupsDocuments.map((skillGroup) => {
      populateEmptySkillHierarchy(skillGroup);
      return skillGroup.toObject();
    });
  }

  async findById(id: string): Promise<ISkillGroup | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const skillGroup = await this.Model.findById(id)
        .populate(populateSkillGroupParentsOptions)
        .populate(populateSkillGroupChildrenOptions)
        .exec();
      return skillGroup != null ? skillGroup.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findById: findById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: FindPaginatedFilter
  ): Promise<ISkillGroup[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const matchStage: Record<string, unknown> = { modelId: modelIdObj };

      if (filter?.childrenIds && filter.childrenType) {
        const childIds = filter.childrenIds
          .split(";")
          .map((id) => id.trim())
          .filter(Boolean)
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        if (!childIds.length) {
          return [];
        }

        const matchingParentIds = await this.hierarchyModel
          .aggregate([
            {
              // TODO: handle grand-parenting.
              //       Cases where we have a Skill (child) -> Skill (parent) -> SkillGroup (grand-parent)
              //                             ^                                   ^
              //                             Given                               expected
              // Index used: src/esco/skillHierarchy/skillHierarchyModel.ts:INDEX_FOR_PARENTS_WITH_SPECIFIC_TYPE
              $match: {
                modelId: modelIdObj,
                parentType: ObjectTypes.SkillGroup,
                childType: filter.childrenType,
                childId: { $in: childIds },
              },
            },
            { $group: { _id: "$parentId" } },
          ])
          .exec();

        const parentIds = matchingParentIds.map((item) => item._id as mongoose.Types.ObjectId);
        if (!parentIds.length) {
          return [];
        }

        matchStage._id = { $in: parentIds };
      }

      if (cursorId && mongoose.Types.ObjectId.isValid(cursorId)) {
        const operator = sortOrder === -1 ? "$lt" : "$gt";
        const currentIdFilter = (matchStage._id ?? {}) as Record<string, unknown>;
        matchStage._id = {
          ...currentIdFilter,
          [operator]: new mongoose.Types.ObjectId(cursorId),
        };
      }

      const pipeline: PipelineStage[] = [{ $match: matchStage }];

      // When requesting only root skill groups, keep the ones that are not a child in the skill hierarchy.
      if (filter?.root) {
        pipeline.push({
          $lookup: {
            from: this.hierarchyModel.collection.name,
            let: { groupId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: [`$${SkillHierarchyModelPaths.childId}`, "$$groupId"] },
                  modelId: { $eq: modelIdObj },
                  childType: { $in: [ObjectTypes.SkillGroup] },
                },
              },
            ],
            as: "parent_links",
          },
        });

        pipeline.push({
          $match: {
            parent_links: { $eq: [] },
          },
        });
      }

      pipeline.push({ $sort: { _id: sortOrder } }, { $limit: limit });

      const results = await this.Model.aggregate(pipeline).exec();

      const hydrated = results.map((r) => this.Model.hydrate(r));
      const populated = await this.Model.populate(hydrated, [
        populateSkillGroupParentsOptions,
        populateSkillGroupChildrenOptions,
      ]);

      return populated.map((doc) => doc.toObject());
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findPaginated: findPaginated failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  findAll(modelId: string): Readable {
    try {
      const pipeline = stream.pipeline(
        this.Model.find({ modelId: { $eq: modelId } }).cursor(),
        new DocumentToObjectTransformer<ISkillGroup>(),
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error(new Error("SkillGroupRepository.findAll: stream failed", { cause: e }));
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findParents(
    modelId: string | mongoose.Types.ObjectId,
    id: string | mongoose.Types.ObjectId,
    limit: number,
    cursor?: string
  ): Promise<ISkillGroup[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return [] as ISkillGroup[];
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        childId: { $eq: new mongoose.Types.ObjectId(id) },
        parentType: ObjectTypes.SkillGroup,
      };
      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.parentId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }
      const pipeline: mongoose.PipelineStage[] = [
        { $match: matchStage as mongoose.PipelineStage.Match["$match"] },
        { $sort: { parentId: 1 } },
        { $limit: limit },
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "parentId",
            foreignField: "_id",
            as: "parent",
          },
        },
        { $match: { "parent.0": { $exists: true } } },
        { $replaceRoot: { newRoot: { $arrayElemAt: ["$parent", 0] } } },
      ];
      const results = await this.hierarchyModel.aggregate(pipeline).exec();
      if (!results.length) return [] as ISkillGroup[];
      const hydrated = results.map((r) => this.Model.hydrate(r));
      const populated = await this.Model.populate(hydrated, [
        populateSkillGroupParentsOptions,
        populateSkillGroupChildrenOptions,
      ]);
      return populated.map((doc) => doc.toObject());
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findParents: findParents failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findChildren(
    modelId: string | mongoose.Types.ObjectId,
    id: string | mongoose.Types.ObjectId,
    limit: number,
    cursor?: string
  ): Promise<ISkillGroupChild[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return [] as ISkillGroupChild[];
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        parentId: new mongoose.Types.ObjectId(id),
      };
      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.childId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }
      const result = await this.hierarchyModel.aggregate([
        {
          $match: matchStage as mongoose.PipelineStage.Match["$match"],
        },
        { $sort: { childId: 1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "skillgroupmodels",
            localField: "childId",
            foreignField: "_id",
            as: "skillGroup",
          },
        },
        {
          $lookup: {
            from: "skillmodels",
            localField: "childId",
            foreignField: "_id",
            as: "skill",
          },
        },
        {
          $addFields: {
            child: {
              $cond: [
                {
                  $in: ["$childType", [ObjectTypes.SkillGroup]],
                },
                {
                  $arrayElemAt: ["$skillGroup", 0],
                },
                {
                  $arrayElemAt: ["$skill", 0],
                },
              ],
            },
          },
        },
        {
          $match: {
            child: { $ne: null },
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toString: "$child._id" },
            parentId: { $toString: "$parentId" },
            UUID: "$child.UUID",
            UUIDHistory: "$child.UUIDHistory",
            originUri: "$child.originUri",
            description: "$child.description",
            preferredLabel: "$child.preferredLabel",
            altLabels: "$child.altLabels",
            code: {
              $cond: {
                if: { $ne: ["$child.code", null] },
                then: "$child.code",
                else: "$$REMOVE",
              },
            },
            isLocalized: {
              $cond: {
                if: { $ne: ["$child.isLocalized", null] },
                then: "$child.isLocalized",
                else: "$$REMOVE",
              },
            },
            objectType: "$childType",
            modelId: { $toString: "$modelId" },
            createdAt: "$child.createdAt",
            updatedAt: "$child.updatedAt",
          },
        },
      ]);
      return result as ISkillGroupChild[];
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findChildren: findChildren failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findHistoryReferencesByUUIDs(uuids: string[]): Promise<ISkillGroupModelHistoryReference[]> {
    try {
      // Pass a bare array (not an explicit { $in: [...] }): mongoose applies $in automatically, and unlike an
      // operator object this is not rewritten by the connection's sanitizeFilter=true.
      const skillGroups = await this.Model.find(
        { UUID: uuids },
        { UUID: 1, _id: 1, modelId: 1, code: 1, preferredLabel: 1 }
      ).exec();
      const byUUID = new Map(skillGroups.map((skillGroup) => [skillGroup.UUID, skillGroup]));
      // Map over the INPUT uuids to preserve order; null-fill for UUIDs that don't resolve to a skill group.
      return uuids.map((uuid) => {
        const skillGroup = byUUID.get(uuid);
        if (!skillGroup) {
          return { UUID: uuid, modelId: null, reference: null };
        }
        // Reuse the shared reference mapper; the reference itself does not carry the modelId, so split it out.
        const { modelId, ...reference } = getSkillGroupDocReference(skillGroup as SkillGroupDocument);
        return { UUID: uuid, modelId: modelId.toString(), reference };
      });
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findHistoryReferencesByUUIDs: findHistoryReferencesByUUIDs failed", {
        cause: e,
      });
      console.error(err);
      throw err;
    }
  }
}
