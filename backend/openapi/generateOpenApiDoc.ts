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
delete Export.Schemas.POST.Request.Payload.$id;
delete Auth.Schemas.Request.Context.$id;
//--------------------------------------------------------------------------------------------------
// Generate the openapi specification and store it in the build folder.
//--------------------------------------------------------------------------------------------------
// @ts-ignore
import version = require("../src/applicationInfo/version.json");
const specs = getOpenAPISpecification(`1.0.0 build:${version.buildNumber} sha:${version.sha}`, ["./src/**/index.ts"], false);

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
        description: "Taxonomy Model API",
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
          ForbiddenResponse: {
            description: "The server understood the request, but is refusing to fulfill it.",
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
          ErrorSchema: APIError.Schemas.Payload,
          PresignedSchema: Presigned.Schemas.GET.Response.Payload,
          ModelInfoResponseSchemaPOST: ModelInfo.Schemas.POST.Response.Payload,
          ModelInfoRequestSchemaPOST: ModelInfo.Schemas.POST.Request.Payload,
          ModelInfoResponseSchemaGET: ModelInfo.Schemas.GET.Response.Payload,
          LocaleSchema: Locale.Schemas.Payload,
          ImportSchema: Import.Schemas.POST.Request.Payload,
          ExportSchema: Export.Schemas.POST.Request.Payload,
          InfoSchema: Info.Schemas.GET.Response.Payload,
          AuthContextSchema: Auth.Schemas.Request.Context,
        },
        securitySchemes: {
          api_key: {
            type: "apiKey",
            in: "header",
            name: "TABIYA-API-KEY",
            description: "Api key authentication.",
          },
          http_auth: {
            type: "http",
            scheme: "basic",
          },
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
