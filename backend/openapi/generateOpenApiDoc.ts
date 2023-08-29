import swaggerJsdoc = require('swagger-jsdoc');
import * as fs from "fs";
import * as path from "node:path";
import Presigned from "api-specifications/presigned";
import ModelInfo from "api-specifications/modelInfo";
import Locale from "api-specifications/locale";
import Import from "api-specifications/import";
import APIError from "api-specifications/error";
import Info from "api-specifications/info";

/**
 *  In ajv the $ref is relative to the root of the schema, while in openapi the $ref is relative to the root of the document.
 *  Due to the different way that ajv and openapi handle $ref, we need to fix the $ref in the schema.
 */
ModelInfo.POST.Response.Schema.properties.locale.$ref = "#" + ModelInfo.POST.Response.Schema.properties.locale.$ref;
ModelInfo.POST.Request.Schema.properties.locale.$ref = "#" + ModelInfo.POST.Request.Schema.properties.locale.$ref;
ModelInfo.GET.Response.Schema.items.properties.locale.$ref = "#" + ModelInfo.GET.Response.Schema.items.properties.locale.$ref;

/**
 * Remove the $id from the schemas as Swagger does not like them.
 * It does not resolve $ref from within the components sections e.g. it will not resolve "$ref": "#/components/schemas/LocaleSchema" from ModelInfoResponseSchema
 */
delete ModelInfo.POST.Response.Schema.$id
delete ModelInfo.POST.Request.Schema.$id
delete ModelInfo.GET.Response.Schema.$id
delete Locale.Schema.$id
delete Presigned.GET.Response.Schema.$id
delete Import.POST.Request.Schema.$id
delete Info.GET.Response.Schema.$id
delete APIError.POST.Response.Schema.$id
//--------------------------------------------------------------------------------------------------
// Generate the openapi specification and store it in the build folder.
//--------------------------------------------------------------------------------------------------
// @ts-ignore
import version = require("../src/info/version.json");
const specs = getOpenAPISpecification(`1.0.0 build:${version.buildNumber} sha:${version.sha}`, ["./src/**/index.ts"], false);

//--------------------------------------------------------------------------------------------------
// Store the openapi specification in the build folder.
//--------------------------------------------------------------------------------------------------
const outputDirName = path.resolve("./build/openapi");
fs.mkdirSync(outputDirName, {recursive: true}); // make sure the directory exists

const filename = path.join(outputDirName, `tabiya-api.json`);
fs.writeFileSync(filename, JSON.stringify(specs, undefined, 2));

/**
 * Function to generate the openapi specification.
 * @param version The version of the api.
 * @param apiPaths Where to find api definitions.
 * @param failOnErrors If true the generation will fail on errors.
 */
function getOpenAPISpecification(version: string, apiPaths: string[] = ['./src/**/index.ts'], failOnErrors: boolean = false) {
  const options = {
    failOnErrors: failOnErrors,
    definition: {
      openapi: '3.1.0',
      info: {
        version: version,
        title: "Taxonomy Model API",
        description: "Taxonomy Model API",
        license: {
          "name": "MIT",
          "url": "https://github.com/tabiya-tech/taxonomy-model-application/blob/main/LICENSE"
        },
      },

      components: {
        responses: {
          AcceptOnlyJSONResponse: {
            description: "Only 'application/json' is supported as request payload.",
            content: {
              "application /json": {
                schema: {
                  "$ref": '#/components/schemas/ErrorSchema'
                }
              }
            }
          },
          InternalServerErrorResponse: {
            description: "The server encountered an unexpected condition.",
            content: {
              "application /json": {
                schema: {
                  "$ref": '#/components/schemas/ErrorSchema'
                }
              }
            }
          },
        },
        schemas: {
          // Add here all schemas that are used in the api
          ErrorSchema: APIError.POST.Response.Schema,
          PresignedSchema: Presigned.GET.Response.Schema,
          ModelInfoResponseSchemaPOST: ModelInfo.POST.Response.Schema,
          ModelInfoRequestSchemaPOST: ModelInfo.POST.Request.Schema,
          ModelInfoResponseSchemaGET: ModelInfo.GET.Response.Schema,
          LocaleSchema: Locale.Schema,
          ImportSchema: Import.POST.Request.Schema,
          InfoSchema: Info.GET.Response.Schema,
        },
        securitySchemes: {
          api_key: {
            type: "apiKey",
            in: "header",
            name: "TABIYA-API-KEY",
            description: "Api key authentication."
          },
          http_auth: {
            type: "http",
            scheme: "basic"
          },
          jwt_auth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      },
      servers: [
        {
          url: "/api"
        }
      ]
    },
    //format: '.yml',

    apis: apiPaths, // files containing annotations as above
  };
  return swaggerJsdoc(options);
}