import swaggerJsdoc = require("swagger-jsdoc");
import * as fs from "fs";
import * as path from "node:path";
import Presigned from "api-specifications/presigned";
import ModelInfo from "api-specifications/modelInfo";
import Locale from "api-specifications/locale";
import Import from "api-specifications/import";
import APIError from "api-specifications/error";
import Info from "api-specifications/info";
import Export from "api-specifications/export";
import Auth from "api-specifications/auth";
import OccupationGroup from "api-specifications/esco/occupationGroup";
import Occupation from "api-specifications/esco/occupation";
import SkillGroup from "api-specifications/esco/skillGroup";
import Skill from "api-specifications/esco/skill";
/**
 *  In ajv the $ref is relative to the root of the schema, while in openapi the $ref is relative to the root of the document.
 *  Due to the different way that ajv and openapi handle $ref, we need to fix the $ref in the schema.
 */
ModelInfo.Schemas.POST.Response.Payload.properties.locale.$ref =
  "#" + ModelInfo.Schemas.POST.Response.Payload.properties.locale.$ref;
ModelInfo.Schemas.POST.Request.Payload.properties.locale.$ref =
  "#" + ModelInfo.Schemas.POST.Request.Payload.properties.locale.$ref;
ModelInfo.Schemas.GET.Response.Payload.items.properties.locale.$ref =
  "#" + ModelInfo.Schemas.GET.Response.Payload.items.properties.locale.$ref;

/**
 * Remove the $id from the schemas as Swagger does not like them.
 * It does not resolve $ref from within the components sections e.g. it will not resolve "$ref": "#/components/schemas/Schema" from ModelInfoResponseSchema
 */
delete ModelInfo.Schemas.POST.Response.Payload.$id;
delete ModelInfo.Schemas.POST.Request.Payload.$id;
delete ModelInfo.Schemas.GET.Response.Payload.$id;
delete Locale.Schemas.Payload.$id;
delete Presigned.Schemas.GET.Response.Payload.$id;
delete Import.Schemas.POST.Request.Payload.$id;
delete Info.Schemas.GET.Response.Payload.$id;
delete APIError.Schemas.Payload.$id;
delete APIError.Schemas.POST.Payload.$id;
delete APIError.Schemas.GET.Payload.$id;
delete APIError.Schemas.PATCH.Payload.$id;
delete Export.Schemas.POST.Request.Payload.$id;
delete Auth.Schemas.Request.Context.$id;
delete OccupationGroup.Schemas.POST.Request.Payload.$id;
delete OccupationGroup.Schemas.POST.Response.Payload.$id;
delete OccupationGroup.Schemas.GET.Response.Payload.$id;
delete OccupationGroup.Schemas.GET.Request.Param.Payload.$id;
delete OccupationGroup.Schemas.GET.Request.Query.Payload.$id;
delete OccupationGroup.Schemas.GET.Request.ById.Param.Payload.$id;
delete Occupation.Schemas.POST.Request.Payload.$id;
delete Occupation.Schemas.POST.Response.Payload.$id;
delete Occupation.Schemas.GET.Response.Payload.$id;
delete Occupation.Schemas.GET.Request.Param.Payload.$id;
delete Occupation.Schemas.GET.Request.Query.Payload.$id;
delete Occupation.Schemas.GET.Request.ById.Param.Payload.$id;
delete SkillGroup.Schemas.POST.Request.Payload.$id;
delete SkillGroup.Schemas.POST.Response.Payload.$id;
delete SkillGroup.Schemas.GET.Response.Payload.$id;
delete SkillGroup.Schemas.GET.Response.ById.Payload.$id;
delete SkillGroup.Schemas.GET.Request.Param.Payload.$id;
delete SkillGroup.Schemas.GET.Request.Query.Payload.$id;
delete SkillGroup.Schemas.GET.Request.ById.Param.Payload.$id;
delete Skill.Schemas.POST.Request.Payload.$id;
delete Skill.Schemas.POST.Request.Param.Payload.$id;
delete Skill.Schemas.POST.Response.Payload.$id;
delete Skill.Schemas.GET.Response.Payload.$id;
delete Skill.Schemas.GET.Response.ById.Payload.$id;
delete Skill.Schemas.GET.Request.Param.Payload.$id;
delete Skill.Schemas.GET.Request.Query.Payload.$id;
delete Skill.Schemas.GET.Request.ById.Param.Payload.$id;
//--------------------------------------------------------------------------------------------------
// Generate the openapi specification and store it in the build folder.
//--------------------------------------------------------------------------------------------------
// @ts-ignore
import version = require("../src/applicationInfo/version.json");
const specs = getOpenAPISpecification(
  `${version.version} build:${version.buildNumber} sha:${version.sha}`,
  ["./src/**/index.ts"],
  false
);

//--------------------------------------------------------------------------------------------------
// Store the openapi specification in the build folder.
//--------------------------------------------------------------------------------------------------
const outputDirName = path.resolve("./build/openapi");
fs.mkdirSync(outputDirName, { recursive: true }); // make sure the directory exists

const filename = path.join(outputDirName, `tabiya-api.json`);
fs.writeFileSync(filename, JSON.stringify(specs, undefined, 2));

/**
 * Function to generate the openapi specification.
 * @param version The version of the api.
 * @param apiPaths Where to find api definitions.
 * @param failOnErrors If true the generation will fail on errors.
 */
function getOpenAPISpecification(
  version: string,
  apiPaths: string[] = ["./src/**/index.ts"],
  failOnErrors: boolean = false
) {
  const options = {
    failOnErrors: failOnErrors,
    definition: {
      openapi: "3.1.0",
      info: {
        version: version,
        title: "Taxonomy Model API",
        description: `
Taxonomy Model API Documentation

NOTES:
1. In order to be authorized to use the API, you need to provide the auth token in the header. \n
   If you are anonymous, you can use the auth header: \`ANONYMOUS\`.
`,
        license: {
          name: "MIT",
          url: "https://github.com/tabiya-tech/taxonomy-model-application/blob/main/LICENSE",
        },
      },

      components: {
        responses: {
          AcceptOnlyJSONResponse: {
            description: "Only 'application/json' is supported as request payload.",
            content: {
              "application /json": {
                schema: {
                  $ref: "#/components/schemas/ErrorSchema",
                },
              },
            },
          },
          InternalServerErrorResponse: {
            description: "The server encountered an unexpected condition.",
            content: {
              "application /json": {
                schema: {
                  $ref: "#/components/schemas/ErrorSchema",
                },
              },
            },
          },
          UnAuthorizedResponse: {
            description:
              "The request failed because it lacks valid authentication credentials for the target resource.",
            content: {
              "application /json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Unauthorized",
                    },
                  },
                },
              },
            },
          },
          ForbiddenResponse: {
            description:
              "The request has not been applied because you don't have the right permissions to access this resource.",
            content: {
              "application /json": {
                schema: {
                  $ref: "#/components/schemas/ErrorSchema",
                },
              },
            },
          },
        },
        schemas: {
          // Add here all schemas that are used in the api
          // Shared, cross-endpoint error schemas
          AllForbidden401ResponseSchema: APIError.Schemas.getPayload("ALL", "Unauthorized", 401, [
            APIError.Constants.Common.ErrorCodes.FORBIDDEN,
          ]),
          AllForbidden403ResponseSchema: APIError.Schemas.getPayload("ALL", "Forbidden", 403, [
            APIError.Constants.Common.ErrorCodes.FORBIDDEN,
          ]),
          AllContentType415ResponseSchema: APIError.Schemas.getPayload("ALL", "ContentType", 415, [
            APIError.Constants.POST.ErrorCodes.MALFORMED_BODY,
          ]),
          All500ResponseSchema: APIError.Schemas.getPayload("POST", "All", 500, [
            APIError.Constants.Common.ErrorCodes.INTERNAL_SERVER_ERROR,
          ]),
          AllNotFound404ResponseSchema: APIError.Schemas.getPayload("ALL", "NotFound", 404, [
            APIError.Constants.Common.ErrorCodes.NOT_FOUND,
          ]),
          // Generic error schemas
          ErrorSchema: APIError.Schemas.Payload,
          ErrorSchemaPOST: APIError.Schemas.POST.Payload,
          ErrorSchemaGET: APIError.Schemas.GET.Payload,
          ErrorSchemaPATCH: APIError.Schemas.PATCH.Payload,
          // OccupationGroup-specific error schemas
          POSTOccupationGroup400ErrorSchema: APIError.Schemas.getPayload(
            "POST",
            "OccupationGroup",
            400,
            Object.values(OccupationGroup.Enums.POST.Response.Status400.ErrorCodes)
          ),
          GETOccupationGroup400ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "OccupationGroup",
            400,
            Object.values(OccupationGroup.Enums.GET.Response.Status400.ErrorCodes)
          ),
          GETOccupationGroup404ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "OccupationGroup",
            404,
            Object.values(OccupationGroup.Enums.GET.Response.Status404.ErrorCodes)
          ),
          GETOccupationGroups404ErrorSchema: APIError.Schemas.getPayload("GET", "OccupationGroups", 404, [
            OccupationGroup.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          ]),
          // Occupation-specific error schemas
          POSTOccupation400ErrorSchema: APIError.Schemas.getPayload(
            "POST",
            "Occupation",
            400,
            Object.values(Occupation.Enums.POST.Response.Status400.ErrorCodes)
          ),
          GETOccupation400ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "Occupation",
            400,
            Object.values(Occupation.Enums.GET.Response.Status400.ErrorCodes)
          ),
          GETOccupation404ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "Occupation",
            404,
            Object.values(Occupation.Enums.GET.Response.Status404.ErrorCodes)
          ),
          GETOccupations404ErrorSchema: APIError.Schemas.getPayload("GET", "Occupations", 404, [
            Occupation.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          ]),
          GETSkillGroup400ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "SkillGroup",
            400,
            Object.values(SkillGroup.Enums.GET.Response.Status400.ErrorCodes)
          ),
          GETSkillGroup404ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "SkillGroup",
            404,
            Object.values(SkillGroup.Enums.GET.Response.Status404.ErrorCodes)
          ),
          GETSkillGroups404ErrorSchema: APIError.Schemas.getPayload("GET", "SkillGroups", 404, [
            SkillGroup.Enums.GET.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          ]),
          // Skill-specific error schemas
          POSTSkill400ErrorSchema: APIError.Schemas.getPayload(
            "POST",
            "Skill",
            400,
            Object.values(Skill.Enums.POST.Response.Status400.ErrorCodes)
          ),
          GETSkill400ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "Skill",
            400,
            Object.values(Skill.Enums.GET.ById.Response.Status400.ErrorCodes)
          ),
          GETSkill404ErrorSchema: APIError.Schemas.getPayload(
            "GET",
            "Skill",
            404,
            Object.values(Skill.Enums.GET.ById.Response.Status404.ErrorCodes)
          ),
          GETSkills404ErrorSchema: APIError.Schemas.getPayload("GET", "Skills", 404, [
            Skill.Enums.GET.List.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          ]),
          PresignedSchema: Presigned.Schemas.GET.Response.Payload,
          ModelInfoResponseSchemaPOST: ModelInfo.Schemas.POST.Response.Payload,
          ModelInfoRequestSchemaPOST: ModelInfo.Schemas.POST.Request.Payload,
          ModelInfoResponseSchemaGET: ModelInfo.Schemas.GET.Response.Payload,
          LocaleSchema: Locale.Schemas.Payload,
          ImportSchema: Import.Schemas.POST.Request.Payload,
          ExportSchema: Export.Schemas.POST.Request.Payload,
          InfoSchema: Info.Schemas.GET.Response.Payload,
          AuthContextSchema: Auth.Schemas.Request.Context,
          OccupationGroupRequestSchemaPOST: OccupationGroup.Schemas.POST.Request.Payload,
          OccupationGroupResponseSchemaPOST: OccupationGroup.Schemas.POST.Response.Payload,
          OccupationGroupRequestParamSchemaGET: OccupationGroup.Schemas.GET.Request.Param.Payload,
          OccupationGroupRequestQueryParamSchemaGET: OccupationGroup.Schemas.GET.Request.Query.Payload,
          OccupationGroupResponseSchemaGET: OccupationGroup.Schemas.GET.Response.Payload,
          OccupationGroupRequestByIdParamSchemaGET: OccupationGroup.Schemas.GET.Request.ById.Param.Payload,
          OccupationRequestSchemaPOST: Occupation.Schemas.POST.Request.Payload,
          OccupationResponseSchemaPOST: Occupation.Schemas.POST.Response.Payload,
          OccupationRequestParamSchemaGET: Occupation.Schemas.GET.Request.Param.Payload,
          OccupationRequestByIdParamSchemaGET: Occupation.Schemas.GET.Request.ById.Param.Payload,
          OccupationRequestQueryParamSchemaGET: Occupation.Schemas.GET.Request.Query.Payload,
          OccupationResponseSchemaGET: Occupation.Schemas.GET.Response.Payload,
          SkillGroupRequestSchemaPOST: SkillGroup.Schemas.POST.Request.Payload,
          SkillGroupResponseSchemaPOST: SkillGroup.Schemas.POST.Response.Payload,
          SkillGroupResponseSchemaGETById: SkillGroup.Schemas.GET.Response.ById.Payload,
          SkillGroupRequestParamSchemaGET: SkillGroup.Schemas.GET.Request.Param.Payload,
          SkillGroupRequestQueryParamSchemaGET: SkillGroup.Schemas.GET.Request.Query.Payload,
          SkillGroupResponseSchemaGET: SkillGroup.Schemas.GET.Response.Payload,
          SkillGroupRequestByIdParamSchemaGET: SkillGroup.Schemas.GET.Request.ById.Param.Payload,
          SkillRequestSchemaPOST: Skill.Schemas.POST.Request.Payload,
          SkillRequestParamSchemaPOST: Skill.Schemas.POST.Request.Param.Payload,
          SkillResponseSchemaPOST: Skill.Schemas.POST.Response.Payload,
          SkillResponseSchemaGETById: Skill.Schemas.GET.Response.ById.Payload,
          SkillRequestParamSchemaGET: Skill.Schemas.GET.Request.Param.Payload,
          SkillRequestQueryParamSchemaGET: Skill.Schemas.GET.Request.Query.Payload,
          SkillResponseSchemaGET: Skill.Schemas.GET.Response.Payload,
          SkillRequestByIdParamSchemaGET: Skill.Schemas.GET.Request.ById.Param.Payload,
        },
        securitySchemes: {
          // api_key: {
          //   type: "apiKey",
          //   in: "header",
          //   name: "TABIYA-API-KEY",
          //   description: "Api key authentication.",
          // },
          // http_auth: {
          //   type: "http",
          //   scheme: "basic",
          // },
          jwt_auth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      servers: [
        {
          url: "/taxonomy/api",
        },
      ],
    }, //format: '.yml',

    apis: apiPaths, // files containing annotations as above
  };
  return swaggerJsdoc(options);
}
