import { StatusCodes } from "http-status-codes/";
import { getServiceErrorFactory } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";
import { fetchWithAuth } from "src/apiService/APIService";
import { ExplorerTreeItem } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import { ExplorerItemDetail, ObjectType } from "src/explorer/explorer.types";

export const PAGE_LIMIT = 100;

type ExplorerApiNodeRef = {
  id: string;
  code?: string;
  preferredLabel: string;
  objectType: ObjectType;
};

// Only child/parent refs self-report objectType; groups use groupType, skill groups report nothing.
type ExplorerApiNode = Omit<ExplorerApiNodeRef, "objectType"> & {
  definition?: string;
  description?: string;
  groupType?: ObjectType;
  children?: ExplorerApiNodeRef[];
};

type ExplorerApiDetailResponse = ExplorerApiNode & {
  UUID: string;
  altLabels?: string[];
  occupationType?: string;
  occupationGroupCode?: string;
  regulatedProfessionNote?: string;
  skillType?: string;
  reuseLevel?: string;
  requiresSkills?: ExplorerItemDetail["requiresSkills"];
  requiredByOccupations?: ExplorerItemDetail["requiredByOccupations"];
};

type PaginatedResponse<T> = {
  data: T[];
  limit: number;
  nextCursor: string | null;
};

const isGroupType = (objectType: ObjectType): boolean =>
  objectType === ObjectType.ISCOGroup || objectType === ObjectType.LocalGroup || objectType === ObjectType.SkillGroup;

const collectionForObjectType = (objectType: ObjectType): string => {
  switch (objectType) {
    case ObjectType.ISCOGroup:
    case ObjectType.LocalGroup:
      return "occupationGroups";
    case ObjectType.SkillGroup:
      return "skillGroups";
    case ObjectType.ESCOOccupation:
    case ObjectType.LocalOccupation:
      return "occupations";
    case ObjectType.Skill:
      return "skills";
  }
};

// Children can be groups or leaves mixed together, so each one carries its own objectType.
const toChildTreeItem = (node: ExplorerApiNodeRef): ExplorerTreeItem => {
  const children = (node as ExplorerApiNode).children?.map(toChildTreeItem);
  return {
    id: node.id,
    code: node.code ?? "",
    title: node.preferredLabel,
    objectType: node.objectType,
    hasChildren: isGroupType(node.objectType) || (children?.length ?? 0) > 0,
    children,
  };
};

// Root items don't self-report an objectType either, so the caller derives it (see rootObjectType).
const toRootTreeItem = (node: ExplorerApiNode, objectType: ObjectType): ExplorerTreeItem => ({
  id: node.id,
  code: node.code ?? "",
  title: node.preferredLabel,
  objectType,
  hasChildren: true,
  children: node.children?.map(toChildTreeItem),
});

export default class ExplorerService {
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
  }

  private async getJSON<T>(url: string, serviceFunction: string): Promise<T> {
    const serviceName = "ExplorerService";
    const errorFactory = getServiceErrorFactory(serviceName, serviceFunction, "GET", url);
    const response = await fetchWithAuth(url, {
      method: "GET",
      headers: {},
      expectedStatusCode: StatusCodes.OK,
      serviceName,
      serviceFunction,
      failureMessage: `Failed to ${serviceFunction}`,
      expectedContentType: "application/json",
    });
    const responseBody = await response.text();
    try {
      return JSON.parse(responseBody) as T;
    } catch (e: unknown) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {
        responseBody,
        error: e,
      });
    }
  }

  // Only a node's children can realistically exceed PAGE_LIMIT, so only getChildren uses this.
  private async getAllPages<T>(buildUrl: (cursor: string | null) => string, serviceFunction: string): Promise<T[]> {
    const results: T[] = [];
    let cursor: string | null = null;
    do {
      const response: PaginatedResponse<T> = await this.getJSON(buildUrl(cursor), serviceFunction);
      results.push(...response.data);
      cursor = response.nextCursor;
    } while (cursor !== null);
    return results;
  }

  public async getRootItems(modelId: string, tab: "occupations" | "skills"): Promise<ExplorerTreeItem[]> {
    const collection = tab === "occupations" ? "occupationGroups" : "skillGroups";
    const url = `${this.apiServerUrl}/models/${modelId}/${collection}?root=true&limit=${PAGE_LIMIT}`;
    const response = await this.getJSON<PaginatedResponse<ExplorerApiNode>>(url, "getRootItems");

    // occupationGroups reports its own groupType; skillGroups reports nothing, so it's always a SkillGroup.
    const rootObjectType = (tab: "occupations" | "skills", node: ExplorerApiNode): ObjectType =>
      tab === "occupations" ? node.groupType ?? ObjectType.ISCOGroup : ObjectType.SkillGroup;

    return response.data.map((node) => toRootTreeItem(node, rootObjectType(tab, node)));
  }

  public async getChildren(modelId: string, item: ExplorerTreeItem): Promise<ExplorerTreeItem[]> {
    const collection = collectionForObjectType(item.objectType as ObjectType);
    const buildUrl = (cursor: string | null) =>
      `${this.apiServerUrl}/models/${modelId}/${collection}/${item.id}/children?limit=${PAGE_LIMIT}` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const nodes = await this.getAllPages<ExplorerApiNodeRef>(buildUrl, "getChildren");
    return nodes.map(toChildTreeItem);
  }

  public async getItemDetail(modelId: string, item: ExplorerTreeItem): Promise<ExplorerItemDetail> {
    const collection = collectionForObjectType(item.objectType as ObjectType);
    const url = `${this.apiServerUrl}/models/${modelId}/${collection}/${item.id}`;
    const node = await this.getJSON<ExplorerApiDetailResponse>(url, "getItemDetail");
    return {
      id: node.id,
      UUID: node.UUID,
      definition: node.definition ?? node.description ?? "",
      altLabels: node.altLabels ?? [],
      objectType: item.objectType as ObjectType,
      code: node.code,
      occupationType: node.occupationType,
      occupationGroupCode: node.occupationGroupCode,
      regulatedProfessionNote: node.regulatedProfessionNote,
      skillType: node.skillType,
      reuseLevel: node.reuseLevel,
      requiresSkills: node.requiresSkills,
      requiredByOccupations: node.requiredByOccupations,
    };
  }
}
