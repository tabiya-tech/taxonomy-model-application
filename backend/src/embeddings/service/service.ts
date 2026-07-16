import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { ISkillGroupRepository } from "esco/skillGroup/repository/SkillGroup.repository";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import {
  EntityEmbeddingStatus,
  IOccupationEmbeddingDoc,
  IOccupationGroupEmbeddingDoc,
  ISetEntityEmbeddingStatusSpec,
  ISkillEmbeddingDoc,
  ISkillGroupEmbeddingDoc,
} from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import {
  IEmbeddingProcessState,
  IIncrementEmbeddingProcessStateCountsSpec,
} from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { EmbeddingModelServiceFactory } from "embeddings/models/embeddingModelServiceFactory";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "./types";
import { computeSourceHash, getSourceText, IEmbeddableEntity } from "./sourceText";

export interface IEmbeddingService {
  processTask(task: IGenerateEmbeddingTask): Promise<void>;
  processTasks(tasks: IGenerateEmbeddingTask[]): Promise<void>;
}

/**
 * The dependencies of the EmbeddingService.
 */
export interface IEmbeddingServiceDependencies {
  skillRepository: ISkillRepository;
  skillGroupRepository: ISkillGroupRepository;
  occupationRepository: IOccupationRepository;
  occupationGroupRepository: IOccupationGroupRepository;
  skillEmbeddingRepository: IEntityEmbeddingRepository<ISkillEmbeddingDoc>;
  skillGroupEmbeddingRepository: IEntityEmbeddingRepository<ISkillGroupEmbeddingDoc>;
  occupationEmbeddingRepository: IEntityEmbeddingRepository<IOccupationEmbeddingDoc>;
  occupationGroupEmbeddingRepository: IEntityEmbeddingRepository<IOccupationGroupEmbeddingDoc>;
  embeddingProcessStateRepository: IEmbeddingProcessStateRepository;
  embeddingModelServiceFactory: EmbeddingModelServiceFactory;
}

/**
 * The entity-type-specific operations the service needs to process a task,
 * so that every entity type is processed by the exact same flow.
 */
interface IEntityTypeHandler {
  findById: (id: string) => Promise<IEmbeddableEntity | null>;
  setEmbeddingStatus: (spec: ISetEntityEmbeddingStatusSpec) => Promise<void>;
  // Only the entity-agnostic operations are needed, so that the handlers of all the entity types share one shape.
  embeddingRepository: Pick<IEntityEmbeddingRepository, "upsert" | "findByEntity">;
}

/**
 * A source text of an entity field, together with its hash.
 */
interface ISource {
  field: EmbeddableField;
  text: string;
  hash: string;
}

/**
 * A task that is ready to be embedded: its embedding process, its entity type handler and the sources
 * whose embeddings need to be (re)generated have been resolved.
 */
interface IPreparedTask {
  task: IGenerateEmbeddingTask;
  processState: IEmbeddingProcessState;
  handler: IEntityTypeHandler;
  staleSources: ISource[];
}

export class EmbeddingService implements IEmbeddingService {
  private readonly embeddingProcessStateRepository: IEmbeddingProcessStateRepository;
  private readonly embeddingModelServiceFactory: EmbeddingModelServiceFactory;
  private readonly entityTypeHandlers: Record<EmbeddableEntityType, IEntityTypeHandler>;

  constructor(dependencies: IEmbeddingServiceDependencies) {
    this.embeddingProcessStateRepository = dependencies.embeddingProcessStateRepository;
    this.embeddingModelServiceFactory = dependencies.embeddingModelServiceFactory;
    this.entityTypeHandlers = {
      [EmbeddableEntityType.Skill]: {
        findById: (id) => dependencies.skillRepository.findById(id),
        setEmbeddingStatus: (spec) => dependencies.skillRepository.setEntityEmbeddingStatus(spec),
        embeddingRepository: dependencies.skillEmbeddingRepository,
      },
      [EmbeddableEntityType.SkillGroup]: {
        findById: (id) => dependencies.skillGroupRepository.findById(id),
        setEmbeddingStatus: (spec) => dependencies.skillGroupRepository.setEntityEmbeddingStatus(spec),
        embeddingRepository: dependencies.skillGroupEmbeddingRepository,
      },
      [EmbeddableEntityType.Occupation]: {
        findById: (id) => dependencies.occupationRepository.findById(id),
        setEmbeddingStatus: (spec) => dependencies.occupationRepository.setEntityEmbeddingStatus(spec),
        embeddingRepository: dependencies.occupationEmbeddingRepository,
      },
      [EmbeddableEntityType.OccupationGroup]: {
        findById: (id) => dependencies.occupationGroupRepository.findById(id),
        setEmbeddingStatus: (spec) => dependencies.occupationGroupRepository.setEntityEmbeddingStatus(spec),
        embeddingRepository: dependencies.occupationGroupEmbeddingRepository,
      },
    };
  }

  /**
   * Generates and stores the embeddings of a single entity, as described by the given task.
   * Convenience wrapper around processTasks — see it for the error semantics.
   */
  async processTask(task: IGenerateEmbeddingTask): Promise<void> {
    await this.processTasks([task]);
  }

  /**
   * Generates and stores the embeddings of the entities described by the given tasks, batching the
   * embedding generation across the tasks so that as many texts as possible are embedded per model call.
   *
   * Error semantics:
   *  - If the unfinished embedding process of a model cannot be fetched (e.g., transient DB error),
   *    the error is rethrown so that the SQS messages are retried. No bookkeeping has happened yet,
   *    so a retry is safe.
   *  - If there is no unfinished embedding process for a model, its tasks are orphans (e.g., their process
   *    was cleaned up) and are skipped, since retrying them can never succeed.
   *  - Any failure after that only affects the tasks it concerns: each one is recorded (entity marked FAILED,
   *    errorCounts incremented) and NOT rethrown, so that the process counters remain consistent — a retry
   *    would count the same document twice.
   */
  async processTasks(tasks: IGenerateEmbeddingTask[]): Promise<void> {
    if (tasks.length === 0) {
      return;
    }

    // 1. Find the unfinished embedding process of every distinct model of the batch. The tasks were pushed
    //    to the queue by those processes, and their embeddingServiceId determines which embedding service
    //    to generate embeddings with.
    const processStateByModelId = new Map<string, IEmbeddingProcessState | null>();
    for (const modelId of new Set(tasks.map((task) => task.modelId))) {
      processStateByModelId.set(modelId, await this.embeddingProcessStateRepository.findPendingByModelId(modelId));
    }

    // 2. Prepare each task: fetch its entity, mark it as being embedded and determine its stale sources.
    //    Tasks of models without an unfinished embedding process are skipped, and tasks that fail to prepare
    //    are recorded as failed — neither prevents the other tasks from being processed.
    const preparedTasks: IPreparedTask[] = [];
    for (const task of tasks) {
      const processState = processStateByModelId.get(task.modelId) ?? null;
      if (processState === null) {
        console.warn(
          `EmbeddingService.processTasks: skipping task for ${task.entityType} ${task.entityId} because there is no unfinished embedding process for model ${task.modelId}`
        );
        continue;
      }
      const preparedTask = await this.prepareTask(task, processState);
      if (preparedTask !== null) {
        preparedTasks.push(preparedTask);
      }
    }

    // 3. Group the prepared tasks by the embedding service of their process, and embed the stale sources
    //    of each group together in batched model calls.
    const groupsByEmbeddingServiceId = new Map<string, IPreparedTask[]>();
    for (const preparedTask of preparedTasks) {
      const embeddingServiceId = preparedTask.processState.embeddingServiceId;
      const group = groupsByEmbeddingServiceId.get(embeddingServiceId) ?? [];
      group.push(preparedTask);
      groupsByEmbeddingServiceId.set(embeddingServiceId, group);
    }
    for (const [embeddingServiceId, group] of groupsByEmbeddingServiceId) {
      await this.embedGroup(embeddingServiceId, group);
    }
  }

  /**
   * Prepares a task for embedding: fetches its entity, marks it as being embedded and determines the
   * sources whose text has changed since their embedding was last generated.
   * Returns null when the task cannot be prepared — its failure has then already been recorded.
   */
  private async prepareTask(
    task: IGenerateEmbeddingTask,
    processState: IEmbeddingProcessState
  ): Promise<IPreparedTask | null> {
    const embeddingServiceId = processState.embeddingServiceId;
    const handler = this.entityTypeHandlers[task.entityType];
    try {
      // Fetch the entity and make sure it exists in the given model.
      const entity = await handler.findById(task.entityId);
      if (entity === null || entity.modelId !== task.modelId) {
        throw new Error(`the ${task.entityType} ${task.entityId} was not found in model ${task.modelId}`);
      }

      // Mark the entity as being embedded.
      await handler.setEmbeddingStatus({
        modelId: task.modelId,
        entityId: task.entityId,
        embeddingServiceId,
        status: EntityEmbeddingStatus.IN_PROGRESS,
      });

      // Build the source texts of the fields to embed. Fields with an empty source text are skipped,
      // as there is nothing to embed.
      const sources: ISource[] = task.fields
        .map((field) => ({ field, text: getSourceText(entity, field) }))
        .filter((source) => source.text.trim().length > 0)
        .map((source) => ({ ...source, hash: computeSourceHash(source.text) }));

      // Skip the fields whose source text has not changed since their embedding was last generated.
      const existingEmbeddings = await handler.embeddingRepository.findByEntity(
        task.modelId,
        task.entityId,
        embeddingServiceId
      );
      const existingHashByField = new Map(
        existingEmbeddings.map((embedding) => [embedding.sourceField, embedding.sourceHash])
      );
      const staleSources = sources.filter((source) => existingHashByField.get(source.field) !== source.hash);

      return { task, processState, handler, staleSources };
    } catch (e: unknown) {
      await this.recordTaskFailure({ task, processState, handler }, e);
      return null;
    }
  }

  /**
   * Generates the embeddings of the stale sources of a group of prepared tasks in as few model calls as
   * possible, and stores them. If the batch generation fails, every task of the group that needed new
   * embeddings is recorded as failed; the tasks with nothing to embed still complete.
   */
  private async embedGroup(embeddingServiceId: string, group: IPreparedTask[]): Promise<void> {
    const texts = group.flatMap((preparedTask) => preparedTask.staleSources.map((source) => source.text));

    let vectors: number[][] = [];
    if (texts.length > 0) {
      try {
        const embeddingModelService = this.embeddingModelServiceFactory(embeddingServiceId);
        vectors = await embeddingModelService.generateEmbeddingBatch(texts);
        if (vectors.length !== texts.length) {
          throw new Error(`the embedding service returned ${vectors.length} embeddings for ${texts.length} texts`);
        }
      } catch (e: unknown) {
        for (const preparedTask of group) {
          if (preparedTask.staleSources.length > 0) {
            await this.recordTaskFailure(preparedTask, e);
          } else {
            // The task had nothing to embed, so the batch failure does not affect it and it can still complete.
            await this.storeAndCompleteTask(preparedTask, []);
          }
        }
        return;
      }
    }

    // Distribute the vectors back to the tasks in the same order their texts were collected,
    // then store them and complete each task.
    let offset = 0;
    for (const preparedTask of group) {
      const taskVectors = vectors.slice(offset, offset + preparedTask.staleSources.length);
      offset += preparedTask.staleSources.length;
      await this.storeAndCompleteTask(preparedTask, taskVectors);
    }
  }

  /**
   * Stores the embeddings of a prepared task (one vector per stale source), marks the entity as completed
   * and records the progress on the embedding process. A failure only affects this task.
   */
  private async storeAndCompleteTask(preparedTask: IPreparedTask, vectors: number[][]): Promise<void> {
    const { task, processState, handler, staleSources } = preparedTask;
    const embeddingServiceId = processState.embeddingServiceId;
    try {
      for (let i = 0; i < staleSources.length; i++) {
        await handler.embeddingRepository.upsert({
          modelId: task.modelId,
          entityId: task.entityId,
          embeddingServiceId,
          sourceField: staleSources[i].field,
          sourceHash: staleSources[i].hash,
          sourceText: staleSources[i].text,
          vector: vectors[i],
        });
      }

      await handler.setEmbeddingStatus({
        modelId: task.modelId,
        entityId: task.entityId,
        embeddingServiceId,
        status: EntityEmbeddingStatus.COMPLETED,
      });
      await this.recordTaskOutcome(processState, { completedDocuments: 1 });
    } catch (e: unknown) {
      await this.recordTaskFailure(preparedTask, e);
    }
  }

  /**
   * Records the failure of a task: the entity is marked FAILED and the document is counted as an error on
   * the embedding process. These are best-effort: if they fail too, the error is logged and the task is
   * still considered handled (see the error semantics of processTasks).
   */
  private async recordTaskFailure(
    failedTask: Pick<IPreparedTask, "task" | "processState" | "handler">,
    cause: unknown
  ): Promise<void> {
    const { task, processState, handler } = failedTask;
    console.error(
      new Error(
        `EmbeddingService.processTasks: failed to generate embeddings for ${task.entityType} ${task.entityId} of model ${task.modelId}`,
        { cause }
      )
    );
    try {
      await handler.setEmbeddingStatus({
        modelId: task.modelId,
        entityId: task.entityId,
        embeddingServiceId: processState.embeddingServiceId,
        status: EntityEmbeddingStatus.FAILED,
      });
    } catch (statusError: unknown) {
      console.error(
        new Error(
          `EmbeddingService.processTasks: failed to mark ${task.entityType} ${task.entityId} of model ${task.modelId} as failed`,
          { cause: statusError }
        )
      );
    }
    try {
      await this.recordTaskOutcome(processState, { errorCounts: 1 });
    } catch (outcomeError: unknown) {
      console.error(
        new Error(
          `EmbeddingService.processTasks: failed to record the failed document on the embedding process ${processState.id}`,
          { cause: outcomeError }
        )
      );
    }
  }

  /**
   * Records that one more document has been handled (successfully or not) on the embedding process,
   * and completes the process when every document has been handled.
   */
  private async recordTaskOutcome(
    processState: IEmbeddingProcessState,
    increments: IIncrementEmbeddingProcessStateCountsSpec
  ): Promise<void> {
    const updatedProcessState = await this.embeddingProcessStateRepository.incrementCounts(processState.id, increments);
    // The process is only completed once it is IN_PROGRESS: while it is still PENDING, the trigger is still
    // pushing tasks to the queue and totalDocuments is not final yet.
    const handledDocuments = updatedProcessState.completedDocuments + updatedProcessState.errorCounts;
    if (
      updatedProcessState.status === ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS &&
      handledDocuments >= updatedProcessState.totalDocuments
    ) {
      await this.embeddingProcessStateRepository.update(updatedProcessState.id, {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      });
    }
  }
}
