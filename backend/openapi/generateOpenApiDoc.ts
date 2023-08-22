import swaggerJsdoc = require('swagger-jsdoc');
import * as fs from "fs";
import * as path from "node:path";
import {PresignedResponseSchema} from "api-specifications/presigned";
import {ImportRequestSchema} from "api-specifications/import";
import {ErrorResponseSchema} from "api-specifications/error";
import {InfoResponseSchemaGET} from "api-specifications/info"
import {LocaleSchema, ModelInfoRequestSchema, ModelInfoResponseSchema} from "api-specifications/modelInfo";
/**
 *  In ajv the $ref is relative to the root of the schema, while in openapi the $ref is relative to the root of the document.
 *  Due to the different way that ajv and openapi handle $ref, we need to fix the $ref in the schema.
 */
ModelInfoResponseSchema.properties.locale.$ref = "#" + ModelInfoResponseSchema.properties.locale.$ref;
ModelInfoRequestSchema.properties.locale.$ref = "#" + ModelInfoRequestSchema.properties.locale.$ref;

/**
 * Remove the $id from the schemas as Swagger does not like them.
 * It does not resolve $ref from within the components sections e.g. it will not resolve "$ref": "#/components/schemas/LocaleSchema" from ModelInfoResponseSchema
 */
delete ModelInfoResponseSchema.$id
delete ModelInfoRequestSchema.$id
delete LocaleSchema.$id
delete PresignedResponseSchema.$id
delete ImportRequestSchema.$id
delete ErrorResponseSchema.$id
delete InfoResponseSchemaGET.$id
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
                  "$ref": '#/components/schemas/ErrorResponseSchema'
                }
              }
            }
          },
          InternalServerErrorResponse: {
            description: "The server encountered an unexpected condition.",
            content: {
              "application /json": {
                schema: {
                  "$ref": '#/components/schemas/ErrorResponseSchema'
                }
              }
            }
          },
        },
        schemas: {
          // Add here all schemas that are used in the api
          ErrorResponseSchema: ErrorResponseSchema,
          PresignedResponseSchema: PresignedResponseSchema,
          ModelInfoResponseSchema: ModelInfoResponseSchema,
          ModelInfoRequestSchema: ModelInfoRequestSchema,
          LocaleSchema: LocaleSchema,
          ImportRequestSchema: ImportRequestSchema,
          InfoResponseSchemaGET: InfoResponseSchemaGET
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