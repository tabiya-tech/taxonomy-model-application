import {AsyncSchema} from "ajv";

export const  modelRequestSchema: AsyncSchema = {
    $async: true,
    $id: "#/components/schemas/modelRequestSchema",
    type: "object",
    properties: {
        name: {
            type: "string"
        },
        description: {
            type: "string"
        },
        locale: {
            $ref: "#/components/schemas/localeSchema"
        }
    },
    required: [
        "name",
        "description",
        "locale"
    ]
}