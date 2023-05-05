import {AsyncSchema} from "ajv";

export const  modelResponseSchema: AsyncSchema = {
    $async: true,
    $id: "#/components/schemas/modelResponseSchema",
    type: "object",
    properties: {
        id: {
            type: "string"
        },
        originUUID: {
            type: "string"
        },
        path: {
            type: "string"
        },
        tabiyaPath: {
            type: "string"
        },
        UUID: {
            type: "string"
        },
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
        "id",
        "originUUID",
        "path",
        "tabiyaPath",
        "UUID",
        "name",
        "description",
        "locale"
    ]
}