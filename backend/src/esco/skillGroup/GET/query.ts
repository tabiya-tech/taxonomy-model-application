import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { parsePath } from "common/parsePath/parsePath";
import { Routes } from "routes.constant";

export type SkillGroupListCursor = {
  id: string;
  createdAt: Date;
};

export function getSkillGroupsPathParameters(path: string): SkillGroupAPISpecs.GET.Types.Request.Param.Payload {
  return parsePath<SkillGroupAPISpecs.GET.Types.Request.Param.Payload>(Routes.SKILL_GROUPS_ROUTE, path);
}

export function encodeCursor(id: string, createdAt: Date): string {
  const payload = {
    id,
    createdAt: createdAt.toISOString(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeCursor(cursor: string): SkillGroupListCursor {
  const json = Buffer.from(cursor, "base64").toString("utf-8");
  const payload = JSON.parse(json);
  return {
    id: payload.id,
    createdAt: new Date(payload.createdAt),
  };
}
