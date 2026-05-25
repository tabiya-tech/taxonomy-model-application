import { APIGatewayProxyEvent } from "aws-lambda";
import { extractAndValidateIdParams } from "../../_shared/params";
import { Routes } from "routes.constant";

export function parseSkillByIdGETPath(event: APIGatewayProxyEvent) {
  return extractAndValidateIdParams(event, Routes.SKILL_ROUTE);
}
