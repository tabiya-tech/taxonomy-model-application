import { SQSClient } from "@aws-sdk/client-sqs";

import { IOccupationGroupService } from "esco/occupationGroup/services/occupationGroup.service.type";
import { getRepositoryRegistry } from "../repositoryRegistry/repositoryRegistry";
import { OccupationService } from "esco/occupations/services/occupation.service";
import { IOccupationService } from "esco/occupations/services/occupation.service.types";
import { OccupationGroupService } from "esco/occupationGroup/services/occupationGroup.service";
import { SkillGroupService } from "esco/skillGroup/services/skillGroup.service";
import { ISkillGroupService } from "esco/skillGroup/services/skillGroup.service.type";
import { SkillService } from "esco/skill/services/skill.service";
import { ISkillService } from "esco/skill/services/skill.service.types";
import { IOccupationHierarchyService } from "esco/occupationHierarchy/occupationHierarchy.service.types";
import { OccupationHierarchyService } from "esco/occupationHierarchy/occupationHierarchy.service";
import { IOccupationToSkillRelationService } from "esco/occupationToSkillRelation/occupationToSkillRelation.service.types";
import { OccupationToSkillRelationService } from "esco/occupationToSkillRelation/occupationToSkillRelation.service";
import { ISkillHierarchyService } from "esco/skillHierarchy/skillHierarchy.service.types";
import { SkillHierarchyService } from "esco/skillHierarchy/skillHierarchy.service";
import { ISkillToSkillRelationService } from "esco/skillToSkillRelation/skillToSkillRelation.service.types";
import { SkillToSkillRelationService } from "esco/skillToSkillRelation/skillToSkillRelation.service";
import { IEmbeddingProcessService } from "embeddings/embeddingProcess/embeddingProcess.service.types";
import { EmbeddingProcessService } from "embeddings/embeddingProcess/embeddingProcess.service";
import { EmbeddingClient } from "embeddings/service/client";
import { getEmbeddingsQueueRegion } from "server/config/config";

export class ServiceRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _services: Map<string, any> = new Map<string, any>();

  public get occupation(): IOccupationService {
    return this._services.get("OccupationService");
  }
  public get occupationGroup(): IOccupationGroupService {
    return this._services.get("OccupationGroupService");
  }
  public get skillGroup(): ISkillGroupService {
    return this._services.get("SkillGroupService");
  }
  public get skill(): ISkillService {
    return this._services.get("SkillService");
  }
  public get occupationHierarchy(): IOccupationHierarchyService {
    return this._services.get("OccupationHierarchyService");
  }
  public get occupationToSkillRelation(): IOccupationToSkillRelationService {
    return this._services.get("OccupationToSkillRelationService");
  }
  public get skillHierarchy(): ISkillHierarchyService {
    return this._services.get("SkillHierarchyService");
  }
  public get skillToSkillRelation(): ISkillToSkillRelationService {
    return this._services.get("SkillToSkillRelationService");
  }
  public get embeddingProcess(): IEmbeddingProcessService {
    return this._services.get("EmbeddingProcessService");
  }

  public set occupation(service: IOccupationService) {
    this._services.set("OccupationService", service);
  }

  public set occupationGroup(service: IOccupationGroupService) {
    this._services.set("OccupationGroupService", service);
  }
  public set skillGroup(service: ISkillGroupService) {
    this._services.set("SkillGroupService", service);
  }
  public set skill(service: ISkillService) {
    this._services.set("SkillService", service);
  }
  public set occupationHierarchy(service: IOccupationHierarchyService) {
    this._services.set("OccupationHierarchyService", service);
  }
  public set occupationToSkillRelation(service: IOccupationToSkillRelationService) {
    this._services.set("OccupationToSkillRelationService", service);
  }
  public set skillHierarchy(service: ISkillHierarchyService) {
    this._services.set("SkillHierarchyService", service);
  }
  public set skillToSkillRelation(service: ISkillToSkillRelationService) {
    this._services.set("SkillToSkillRelationService", service);
  }
  public set embeddingProcess(service: IEmbeddingProcessService) {
    this._services.set("EmbeddingProcessService", service);
  }

  async initialize() {
    const awsSQSClient = new SQSClient({ region: getEmbeddingsQueueRegion() });
    const repositoryRegistry = getRepositoryRegistry();
    this.occupation = new OccupationService(repositoryRegistry.occupation, repositoryRegistry.modelInfo);
    this.occupationGroup = new OccupationGroupService(
      repositoryRegistry.OccupationGroup,
      repositoryRegistry.occupationHierarchy
    );
    this.skillGroup = new SkillGroupService(repositoryRegistry.skillGroup);
    this.skill = new SkillService(repositoryRegistry.skill, repositoryRegistry.modelInfo);
    this.occupationHierarchy = new OccupationHierarchyService(
      repositoryRegistry.occupation,
      repositoryRegistry.OccupationGroup,
      repositoryRegistry.occupationHierarchy
    );
    this.occupationToSkillRelation = new OccupationToSkillRelationService(
      repositoryRegistry.occupation,
      repositoryRegistry.skill,
      repositoryRegistry.occupationToSkillRelation
    );
    this.skillHierarchy = new SkillHierarchyService(
      repositoryRegistry.skill,
      repositoryRegistry.skillGroup,
      repositoryRegistry.skillHierarchy
    );
    this.skillToSkillRelation = new SkillToSkillRelationService(
      repositoryRegistry.skill,
      repositoryRegistry.skillToSkillRelation
    );
    const embeddingClient = new EmbeddingClient(awsSQSClient);
    this.embeddingProcess = new EmbeddingProcessService(
      repositoryRegistry.modelInfo,
      repositoryRegistry.embeddingProcessState,
      repositoryRegistry.skill,
      repositoryRegistry.skillGroup,
      repositoryRegistry.occupation,
      repositoryRegistry.OccupationGroup,
      embeddingClient
    );
  }
}

const _serviceRegistryInstance: ServiceRegistry = new ServiceRegistry();

export function getServiceRegistry(): ServiceRegistry {
  return _serviceRegistryInstance;
}
