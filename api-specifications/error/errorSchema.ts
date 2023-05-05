import {AsyncSchema, Schema} from "ajv";
export const errorResponseSchema: AsyncSchema = {
    $async: true,
    $id: "#/components/schemas/errorResponseSchema",
    type: "array",
    items: [
        {
            type: "object",
            properties: {
                error: {
                    "type": "string"
                },
                message: {
                    "type": "string"
                },
                details: {
                    type: "string"
                },
                path: {
                    type: "string"
                },
            },
            required: [
                "error",
                "message",
                "details",
                "path"
            ]
        }
    ],
    additionalProperties: false
}
