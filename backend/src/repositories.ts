import {IModelRepository} from "./modelInfo/ModelRepository";

export class RepositoryRegistry {
  // eslint-disable-next-line
  private readonly _repositories: Map<string,any> = new Map<string, any>();
  public get modelInfo(): IModelRepository {
    return this._repositories.get("ModelRepository");
  }
  public set modelInfo(repository: IModelRepository) {
    this._repositories.set("ModelRepository", repository);
  }
}
export const repositories = new RepositoryRegistry();
 