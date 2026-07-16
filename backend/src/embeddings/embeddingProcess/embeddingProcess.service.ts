import { Readable } from "node:stream";
import mongoose from "mongoose";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { ISkillGroupRepository } from "esco/skillGroup/repository/SkillGroup.repository";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { IEmbeddingClient } from "embeddings/service/client";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "embeddings/service/types";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IAsyncPublishEmbeddingsTaskInvoker } from "embeddings/asyncPublishEmbeddingsTask/asyncPublishEmbeddingsTask.types";
import { IEmbeddingProcessService } from "./embeddingProcess.service.types";
import {
  DatabaseError,
  EmbeddingProcessAlreadyRunningError,
  ModelNotFoundError,
  ModelNotReleasedError,
} from "./errors";

/**
 * The fields of each entity type that should be embedded.
 */
const EMBEDDABLE_FIELDS_BY_ENTITY_TYPE: Record<EmbeddableEntityType, EmbeddableField[]> = {
  [EmbeddableEntityType.Skill]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
  ],
  [EmbeddableEntityType.SkillGroup]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
    EmbeddableField.scopeNote,
  ],
  [EmbeddableEntityType.Occupation]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
  ],
  [EmbeddableEntityType.OccupationGroup]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
  ],
};

/**
 * Number of tasks to accumulate from the entity stream before flushing them to the queue
 * in a single pushTasksToQueue call, so that the entire entity set is never held in memory at once.
 */
export const TASKS_FLUSH_SIZE = 1000;

export class EmbeddingProcessService implements IEmbeddingProcessService {
  constructor(
    private readonly modelRepository: IModelRepository,
    private readonly embeddingProcessStateRepository: IEmbeddingProcessStateRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly skillGroupRepository: ISkillGroupRepository,
    private readonly occupationRepository: IOccupationRepository,
    private readonly occupationGroupRepository: IOccupationGroupRepository,
    private readonly embeddingClient: IEmbeddingClient,
    private readonly asyncPublishEmbeddingsTaskInvoker: IAsyncPublishEmbeddingsTaskInvoker
  ) {}

  async triggerEmbeddingProcess(modelId: string, embeddingServiceId: string): Promise<IEmbeddingProcessState> {
    // An invalid object id can never reference an existing model,
    // and would cause a CastError in the queries below.
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      throw new ModelNotFoundError(modelId);
    }

    let model = null;
    try {
      // 1. Check that the model exists and has been released.
      model = await this.modelRepository.getModelById(modelId);
    } catch (e) {
      throw new DatabaseError("Failed to find the taxonomy model by id");
    }

    if (model === null) {
      throw new ModelNotFoundError(modelId);
    }

    if (!model.released) {
      throw new ModelNotReleasedError(modelId);
    }

    let pendingProcess;
    try {
      // 2. Check that there is no other unfinished embedding process for the same model.
      pendingProcess = await this.embeddingProcessStateRepository.findPendingByModelId(modelId);
    } catch (e) {
      throw new DatabaseError("Failed to find the embedding process state by model id");
    }

    if (pendingProcess !== null) {
      throw new EmbeddingProcessAlreadyRunningError(modelId);
    }

    let embeddingProcessState: IEmbeddingProcessState;
    try {
      // 3. Create a new embedding process state in the PENDING status.
      embeddingProcessState = await this.embeddingProcessStateRepository.create({
        modelId,
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
        embeddingServiceId,
        totalDocuments: 0,
        errorCounts: 0,
        warningCounts: 0,
        completedDocuments: 0,
      });
    } catch (e) {
      throw new Error(`Failed to trigger embedding process for model ${modelId}.`, { cause: e });
    }

    try {
      // 4. Invoke the async-publish-embeddings-task lambda, which streams every entity of the model from
      //    the database and pushes it to the embeddings queue in the background. This is the slow part of
      //    the process and would otherwise make the API request time out on large models.
      await this.asyncPublishEmbeddingsTaskInvoker.invoke({
        processId: embeddingProcessState.id,
        modelId,
        embeddingServiceId,
      });
    } catch (e) {
      // Clean up the created process state so that a failed attempt does not leave an orphaned
      // unfinished record behind, which would block any future embedding process for the model.
      await this.cleanUpProcessState(embeddingProcessState.id, modelId);
      throw new Error(`Failed to trigger embedding process for model ${modelId}.`, { cause: e });
    }

    // 5. Return the created (PENDING) process state. The client polls it to follow the progress that the
    //    background lambda reports as it publishes the entities and the embeddings are generated.
    return embeddingProcessState;
  }

  async publishEmbeddingTasks(processId: string, modelId: string, embeddingServiceId: string): Promise<void> {
    try {
      // 1. Mark all the entities of the model as PENDING for this embedding service,
      //    so that the entities reflect that their embeddings are about to be (re)generated.
      const markPendingProps = { modelId, embeddingServiceId, status: EntityEmbeddingStatus.PENDING };
      const markEntitiesPending = [
        () => this.skillRepository.setModelEntitiesEmbeddingStatus(markPendingProps),
        () => this.skillGroupRepository.setModelEntitiesEmbeddingStatus(markPendingProps),
        () => this.occupationRepository.setModelEntitiesEmbeddingStatus(markPendingProps),
        () => this.occupationGroupRepository.setModelEntitiesEmbeddingStatus(markPendingProps),
      ];
      for (const markPending of markEntitiesPending) {
        await markPending();
      }

      // 2. Loop through all the entities of the model and push each of them to the embeddings queue.
      //    The order follows the requirement: skills, skill groups, occupations, occupation groups.
      const entitySources: { entityType: EmbeddableEntityType; findAll: () => Readable }[] = [
        { entityType: EmbeddableEntityType.Skill, findAll: () => this.skillRepository.findAll(modelId) },
        { entityType: EmbeddableEntityType.SkillGroup, findAll: () => this.skillGroupRepository.findAll(modelId) },
        { entityType: EmbeddableEntityType.Occupation, findAll: () => this.occupationRepository.findAll(modelId) },
        {
          entityType: EmbeddableEntityType.OccupationGroup,
          findAll: () => this.occupationGroupRepository.findAll(modelId),
        },
      ];

      let totalDocuments = 0;
      for (const entitySource of entitySources) {
        totalDocuments += await this.pushEntitiesToQueue(modelId, entitySource.entityType, entitySource.findAll());
      }

      // 3. Update the embedding process state with the total number of documents that were pushed to the queue.
      //    A model without any entity has nothing to process, so its embedding process completes right away —
      //    no queue task will ever come back to complete it otherwise.
      await this.embeddingProcessStateRepository.update(processId, {
        status:
          totalDocuments === 0
            ? ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED
            : ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
        totalDocuments,
      });

      // 4. The embedding lambda only completes the process while it is IN_PROGRESS, so if every queued task
      //    was already handled before the process was marked IN_PROGRESS, no task is left to complete it.
      //    Re-read the state (the lambda increments the counters concurrently) to close that race.
      const refreshedProcessState = await this.embeddingProcessStateRepository.findById(processId);
      if (
        refreshedProcessState !== null &&
        refreshedProcessState.status === ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS &&
        refreshedProcessState.completedDocuments + refreshedProcessState.errorCounts >=
          refreshedProcessState.totalDocuments
      ) {
        await this.embeddingProcessStateRepository.update(processId, {
          status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
        });
      }
    } catch (e) {
      // Clean up the process state so that a failed attempt does not leave an orphaned
      // unfinished record behind, which would block any future embedding process for the model.
      await this.cleanUpProcessState(processId, modelId);
      throw new Error(`Failed to publish embedding tasks for process ${processId} of model ${modelId}.`, { cause: e });
    }
  }

  /**
   * Deletes the given embedding process state, swallowing (but logging) any cleanup error so that it never
   * masks the original failure that triggered the cleanup.
   */
  private async cleanUpProcessState(processId: string, modelId: string): Promise<void> {
    try {
      await this.embeddingProcessStateRepository.deleteById(processId);
    } catch (cleanupError) {
      console.error(
        new Error(
          `Failed to clean up the embedding process state ${processId} after a failed embedding process for model ${modelId}.`,
          { cause: cleanupError }
        )
      );
    }
  }

  private async pushEntitiesToQueue(
    modelId: string,
    entityType: EmbeddableEntityType,
    stream: Readable
  ): Promise<number> {
    let count = 0;
    let tasksBuffer: IGenerateEmbeddingTask[] = [];
    for await (const entity of stream) {
      tasksBuffer.push({
        modelId,
        entityId: (entity as { id: string }).id,
        entityType,
        fields: EMBEDDABLE_FIELDS_BY_ENTITY_TYPE[entityType],
      });
      count++;
      if (tasksBuffer.length >= TASKS_FLUSH_SIZE) {
        await this.embeddingClient.pushTasksToQueue(tasksBuffer);
        tasksBuffer = [];
      }
    }
    if (tasksBuffer.length > 0) {
      await this.embeddingClient.pushTasksToQueue(tasksBuffer);
    }
    return count;
  }
}
