import { IOccupationGroupService } from "esco/occupationGroup/occupationGroupService.type";
import { getRepositoryRegistry } from "../repositoryRegistry/repositoryRegistry";
import { OccupationService } from "esco/occupations/occupationService";
import { IOccupationService } from "esco/occupations/occupationService.types";
import { OccupationGroupService } from "esco/occupationGroup/occupationGroupService";
import { SkillGroupService } from "esco/skillGroup/skillGroupService";
import { ISkillGroupService } from "esco/skillGroup/skillGroupService.type";
import { SkillService } from "esco/skill/skillService";
import { ISkillService } from "esco/skill/skillService.type";

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

  async initialize() {
    const repositoryRegistry = getRepositoryRegistry();
    this.occupation = new OccupationService(repositoryRegistry.occupation, repositoryRegistry.modelInfo);
    this.occupationGroup = new OccupationGroupService(repositoryRegistry.OccupationGroup);
    this.skillGroup = new SkillGroupService(repositoryRegistry.skillGroup);
    this.skill = new SkillService(repositoryRegistry.skill, repositoryRegistry.modelInfo);
  }
}

const _serviceRegistryInstance: ServiceRegistry = new ServiceRegistry();

export function getServiceRegistry(): ServiceRegistry {
  return _serviceRegistryInstance;
}
