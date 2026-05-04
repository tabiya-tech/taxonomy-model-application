import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { parsePath } from "common/parsePath/parsePath";
import { Routes } from "routes.constant";

export type OccupationGroupListCursor = {
  id: string;
  createdAt: Date;
};

export function getOccupationGroupsPathParameters(path: string): OccupationGroupAPISpecs.GET.Types.Request.Param.Payload {
  return parsePath<OccupationGroupAPISpecs.GET.Types.Request.Param.Payload>(Routes.OCCUPATION_GROUPS_ROUTE, path);
}

export function encodeCursor(id: string, createdAt: Date): string {
  const payload = {
    id,
    createdAt: createdAt.toISOString(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeCursor(cursor: string): OccupationGroupListCursor {
  const json = Buffer.from(cursor, "base64").toString("utf-8");
  const payload = JSON.parse(json);
  return {
    id: payload.id,
    createdAt: new Date(payload.createdAt),
  };
}
